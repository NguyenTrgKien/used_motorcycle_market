import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { hashPass } from 'src/utils/handlePassword';
import {
  TargetType,
  PostStatus,
  UserRole,
  UserStatus,
  UserTwoFactorMethod,
  VerificationType,
} from 'src/shared';
import { nanoid } from 'nanoid';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { UserAddressService } from '../user_address/user_address.service';
import 'multer';
import { UpdateUserPrivacyDto } from './dto/update-user-privacy.dto';
import { UpdateCreatePostGuideDto } from './dto/update-create-post-guide.dto';
import { Post } from '../post/entities/post.entity';
import { PostImage } from '../post_image/entities/post_image.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { Review } from '../review/entities/review.entity';
import { Report } from '../report/entities/report.entity';
import { SavedPost } from '../saved_post/entities/saved_post.entity';
import { Notification } from '../notification/entities/notification.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { UserIdentity } from '../user_identity/entities/user_identity.entity';
import { UserSession } from '../user_session/entities/user_session.entity';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(UserAddress)
    private readonly userAddressRepo: Repository<UserAddress>,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => UserAddressService))
    private readonly userAddressService: UserAddressService,
  ) {}
  async create(data: {
    email: string;
    fullName?: string;
    avatar?: string;
    googleId: string;
  }) {
    let fullName = data.fullName;
    if (!fullName) {
      fullName = `User-${nanoid(4)}`;
    }
    return await this.userRepo.save({
      email: data.email,
      googleId: data.googleId,
      fullName,
      isVerified: true,
      ...(data.avatar ? { avatar: data.avatar } : {}),
    });
  }

  async getMe(userId: number) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        isPhoneVerified: Boolean(user.phoneVerifiedAt),
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        sellerType: user.sellerType,
        isGoogleLinked: Boolean(user.googleId),
        isFaceBookLinked: Boolean(user.facebookId),
        createdAt: user.createdAt,
        addresses: user.addresses,
        hasPassword: Boolean(user.password),
        hasSeenCreatePostGuide: user.hasSeenCreatePostGuide,
        privacy: {
          showEmail: user.showEmail,
          showPhone: user.showPhone,
        },
      },
    };
  }

  async getDataSecuritySetting(userId: number) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    const dataSecurity = {
      isVerified: user.isVerified,
      isPhoneVerified: Boolean(user.phoneVerifiedAt),
      two_factor_enabled: user.two_factor_enabled,
      two_factor_method: user.two_factor_method,
      privacy: {
        showEmail: user.showEmail,
        showPhone: user.showPhone,
      },
    };

    return {
      security: dataSecurity,
    };
  }

  async findUserById(userId: number) {
    return await this.userRepo.findOne({
      where: {
        id: userId,
      },
      relations: ['addresses'],
    });
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
      relations: ['verifications'],
    });
    return user;
  }

  async findUserByPhone(phone: string) {
    const user = await this.userRepo.findOne({
      where: {
        phone,
      },
      relations: ['verifications'],
    });
    return user;
  }

  async register(dataRegister: RegisterDto) {
    const email = dataRegister.email.trim().toLowerCase();
    const { password } = dataRegister;
    const hashPassword = await hashPass(password);
    const fullName = `User-${nanoid(4)}`;

    const { newUser, verifyToken } = await this.dataSource.transaction(
      async (manager) => {
        try {
          const newUser = await manager.save(User, {
            email,
            password: hashPassword,
            role: UserRole.USER,
            fullName,
            isVerified: false,
          });

          const verifyToken = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
          const expiredAt = new Date(Date.now() + 1000 * 60 * 5);
          await manager.save(UserVerification, {
            type: VerificationType.REGISTER_EMAIL,
            token: await hashPass(verifyToken),
            expiredAt,
            user: {
              id: newUser.id,
            },
          });

          return { newUser, verifyToken };
        } catch (error: any) {
          if (
            error instanceof Error &&
            'code' in error &&
            (error.code === '23505' || error.code === 'ER_DUP_ENTRY')
          ) {
            throw new BadRequestException(
              'Email đã được dùng! Vui lòng chọn email khác.',
            );
          }
          throw error;
        }
      },
    );
    try {
      await this.mailService.sendOtp(email, verifyToken);
    } catch (error) {
      console.log('Send mail failed', error);
      throw new InternalServerErrorException(
        'Không thể gửi email xác minh. Vui lòng yêu cầu gửi lại OTP!',
      );
    }

    return newUser;
  }

  async getAllUsers(adminId: number) {
    try {
      const admin = await this.userRepo.findOne({
        where: {
          id: adminId,
          role: UserRole.ADMIN,
        },
      });

      if (!admin) {
        throw new BadRequestException('Ban khong co quyen quan ly nguoi dung');
      }

      const user = await this.userRepo.find({
        where: {
          status: UserStatus.ACTIVE,
        },
      });
      return {
        message: 'Lấy danh sách người dùng thành công!',
        data: user.map((item) => this.toPublicUser(item)),
      };
    } catch (error) {
      console.log(error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getManagedUsers(
    adminId: number,
    query: Record<string, string | undefined> = {},
  ) {
    const admin = await this.userRepo.findOne({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Ban khong co quyen quan ly nguoi dung');
    }

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
    const keyword = query.keyword?.trim();
    const status = query.status?.trim() as UserStatus | 'all' | undefined;

    const qb = this.userRepo
      .createQueryBuilder('appUser')
      .where('appUser.role = :role', { role: UserRole.USER })
      .andWhere('appUser.id != :adminId', { adminId });

    if (
      status &&
      status !== 'all' &&
      Object.values(UserStatus).includes(status)
    ) {
      qb.andWhere('appUser.status = :status', { status });
    }

    if (keyword) {
      qb.andWhere(
        '(LOWER(appUser.fullName) LIKE LOWER(:keyword) OR LOWER(appUser.email) LIKE LOWER(:keyword) OR appUser.phone LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('appUser.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const statusCounts = await this.userRepo
      .createQueryBuilder('appUser')
      .select('appUser.status', 'status')
      .addSelect('COUNT(appUser.id)', 'count')
      .where('appUser.role = :role', { role: UserRole.USER })
      .groupBy('appUser.status')
      .getRawMany<{ status: UserStatus; count: string }>();

    return {
      message: 'Lay danh sach nguoi dung thanh cong',
      data: {
        items: items.map((item) => this.toAdminUser(item)),
        total,
        page,
        limit,
        counts: {
          active: Number(
            statusCounts.find((item) => item.status === UserStatus.ACTIVE)
              ?.count || 0,
          ),
          banned: Number(
            statusCounts.find((item) => item.status === UserStatus.BANNED)
              ?.count || 0,
          ),
        },
      },
    };
  }

  async getManagedUserDetail(adminId: number, id: number) {
    const admin = await this.userRepo.findOne({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Ban khong co quyen quan ly nguoi dung');
    }

    const user = await this.userRepo.findOne({
      where: {
        id,
        role: UserRole.USER,
      },
    });

    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    const postCounts = await this.postRepo
      .createQueryBuilder('post')
      .select('post.status', 'status')
      .addSelect('COUNT(post.id)', 'count')
      .where('post.userId = :userId', { userId: id })
      .groupBy('post.status')
      .getRawMany<{ status: PostStatus; count: string }>();

    const posts = await this.postRepo.find({
      where: { userId: id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        province: true,
        district: true,
        ward: true,
        rejectedReason: true,
        hiddenReason: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const postIds = posts.map((post) => post.id);
    const reportsQuery = this.reportRepo
      .createQueryBuilder('report')
      .leftJoin('report.reporter', 'reporter')
      .select([
        'report.id',
        'report.reporterId',
        'report.targetId',
        'report.targetType',
        'report.reasonType',
        'report.reasonDetail',
        'report.status',
        'report.note',
        'report.createdAt',
        'report.updatedAt',
        'reporter.id',
        'reporter.fullName',
        'reporter.email',
      ])
      .where('report.targetType = :userTargetType AND report.targetId = :id', {
        userTargetType: TargetType.USER,
        id,
      });

    if (postIds.length > 0) {
      reportsQuery.orWhere(
        'report.targetType = :postTargetType AND report.targetId IN (:...postIds)',
        {
          postTargetType: TargetType.POST,
          postIds,
        },
      );
    }

    const reports = await reportsQuery
      .orderBy('report.createdAt', 'DESC')
      .take(20)
      .getMany();

    const addresses = await this.userAddressRepo.find({
      where: {
        user: { id },
      },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC',
      },
      take: 10,
    });

    const getPostCount = (status: PostStatus) =>
      Number(postCounts.find((item) => item.status === status)?.count || 0);

    return {
      message: 'Lay thong tin chi tiet nguoi dung thanh cong',
      data: {
        user: this.toAdminUser(user),
        postStats: {
          total: postCounts.reduce((sum, item) => sum + Number(item.count), 0),
          draft: getPostCount(PostStatus.DRAFT),
          pending: getPostCount(PostStatus.PENDING),
          active: getPostCount(PostStatus.ACTIVE),
          sold: getPostCount(PostStatus.SOLD),
          expired: getPostCount(PostStatus.EXPIRED),
          hidden: getPostCount(PostStatus.HIDDEN),
          rejected: getPostCount(PostStatus.REJECTED),
        },
        posts,
        addresses,
        violations: reports.map((report) => ({
          id: report.id,
          reporterId: report.reporterId,
          reporterName: report.reporter?.fullName,
          reporterEmail: report.reporter?.email,
          targetId: report.targetId,
          targetType: report.targetType,
          reasonType: report.reasonType,
          reasonDetail: report.reasonDetail,
          status: report.status,
          note: report.note,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        })),
      },
    };
  }

  async getStaffUsers(
    adminId: number,
    query: Record<string, string | undefined> = {},
  ) {
    const admin = await this.userRepo.findOne({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Ban khong co quyen quan ly nhan vien');
    }

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
    const keyword = query.keyword?.trim();
    const role = query.role?.trim() as UserRole | undefined;
    const staffRoles = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.CSKH];
    const allowedRoleFilters = [...staffRoles, UserRole.USER];

    const qb = this.userRepo
      .createQueryBuilder('staff')
      .where('staff.role IN (:...staffRoles)', { staffRoles });

    if (role && allowedRoleFilters.includes(role)) {
      qb.andWhere('staff.role = :role', { role });
    }

    if (keyword) {
      qb.andWhere(
        '(LOWER(staff.fullName) LIKE LOWER(:keyword) OR LOWER(staff.email) LIKE LOWER(:keyword) OR staff.phone LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await qb
      .orderBy(
        `CASE staff.role WHEN '${UserRole.ADMIN}' THEN 1 WHEN '${UserRole.MODERATOR}' THEN 2 WHEN '${UserRole.CSKH}' THEN 3 ELSE 4 END`,
        'ASC',
      )
      .addOrderBy('staff.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const roleCounts = await this.userRepo
      .createQueryBuilder('staff')
      .select('staff.role', 'role')
      .addSelect('COUNT(staff.id)', 'count')
      .where('staff.role IN (:...staffRoles)', { staffRoles })
      .groupBy('staff.role')
      .getRawMany<{ role: UserRole; count: string }>();

    return {
      message: 'Lay danh sach nhan vien thanh cong',
      data: {
        items: items.map((item) => this.toAdminUser(item)),
        total,
        page,
        limit,
        counts: {
          admin: Number(
            roleCounts.find((item) => item.role === UserRole.ADMIN)?.count || 0,
          ),
          moderator: Number(
            roleCounts.find((item) => item.role === UserRole.MODERATOR)
              ?.count || 0,
          ),
          cskh: Number(
            roleCounts.find((item) => item.role === UserRole.CSKH)?.count || 0,
          ),
        },
      },
    };
  }

  async updateStaffRole(adminId: number, userId: number, role: UserRole) {
    if (adminId === userId) {
      throw new BadRequestException(
        'Khong the tu thay doi vai tro cua chinh minh',
      );
    }

    const admin = await this.userRepo.findOne({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Ban khong co quyen cap nhat vai tro');
    }

    const allowedRoles = [UserRole.USER, UserRole.MODERATOR, UserRole.CSKH];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Vai tro nhan vien khong hop le');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Khong the thay doi vai tro quan tri vien');
    }

    await this.userRepo.update(user.id, {
      role,
    });

    const updatedUser = await this.userRepo.findOne({
      where: {
        id: user.id,
      },
    });

    return {
      message: 'Cap nhat vai tro nhan vien thanh cong',
      data: updatedUser ? this.toAdminUser(updatedUser) : null,
    };
  }

  async createStaff(adminId: number, dataCreate: CreateStaffDto) {
    const admin = await this.userRepo.findOne({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Ban khong co quyen tao nhan vien');
    }

    const allowedRoles = [UserRole.MODERATOR, UserRole.CSKH];
    if (!allowedRoles.includes(dataCreate.role)) {
      throw new BadRequestException('Vai tro nhan vien khong hop le');
    }

    const existEmail = await this.findUserByEmail(dataCreate.email);
    if (existEmail) {
      throw new BadRequestException('Email da ton tai');
    }

    if (dataCreate.phone) {
      const existPhone = await this.findUserByPhone(dataCreate.phone);
      if (existPhone) {
        throw new BadRequestException('So dien thoai da ton tai');
      }
    }

    const password = await hashPass(dataCreate.password);
    const staff = await this.userRepo.save({
      fullName: dataCreate.fullName.trim(),
      email: dataCreate.email.trim().toLowerCase(),
      password,
      phone: dataCreate.phone?.trim() || undefined,
      role: dataCreate.role,
      isVerified: true,
      status: UserStatus.ACTIVE,
    });

    return {
      message: 'Tao nhan vien thanh cong',
      data: this.toAdminUser(staff),
    };
  }

  async getUserById(id: number) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          id,
        },
        relations: ['addresses'],
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại!');
      }

      return {
        message: 'Lấy thông tin người dùng thành công!',
        data: this.toPublicUser(user),
      };
    } catch (error) {
      console.log(error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async updateAvatar(
    requesterId: number,
    id: number,
    avatar?: Express.Multer.File,
  ) {
    const requester = await this.userRepo.findOne({
      where: {
        id: requesterId,
      },
    });

    if (!requester) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    if (requester.id !== id && requester.role !== UserRole.ADMIN) {
      throw new BadRequestException('Ban khong co quyen cap nhat avatar nay');
    }

    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    if (avatar) {
      const uploadResult =
        await this.cloudinaryService.uploadSingleFile(avatar);
      user.avatar = uploadResult.url;
      user.publicId = uploadResult.publicId;
    }

    await this.userRepo.save(user);

    return {
      message: 'Cập nhật avatar thành công!',
    };
  }

  async updateUserBasic(
    requesterId: number,
    id: number,
    dataUpdate: UpdateUserDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const { addressId, birthday, fullName, gender, personalInfo } =
        dataUpdate;
      const requester = await manager.findOne(User, {
        where: { id: requesterId },
      });

      if (!requester) {
        throw new NotFoundException('Khong tim thay nguoi dung');
      }

      if (requester.id !== id && requester.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'Ban khong co quyen cap nhat nguoi dung nay',
        );
      }

      const user = await manager.findOne(User, {
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }

      await manager.update(User, user.id, {
        fullName,
        gender,
        personalInfo,
        birthday,
      });

      if (addressId) {
        await this.userAddressService.setDefaultAddress(
          user.id,
          addressId,
          manager,
        );
      }

      const dataUser = await manager.findOne(User, {
        where: { id },
      });
      if (!dataUser) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = dataUser;
      return {
        message: 'Cập nhật người dùng thành công!',
        data: rest,
      };
    });
  }

  async updatePrivacy(userId: number, data: UpdateUserPrivacyDto) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng!');
    }

    await this.userRepo.update(user.id, {
      showEmail: data.showEmail,
      showPhone: data.showPhone,
    });

    return {
      message: 'Cáº­p nháº­t quyá»n riÃªng tÆ° thÃ nh cÃ´ng!',
      privacy: {
        showEmail: data.showEmail,
        showPhone: data.showPhone,
      },
    };
  }

  async updateCreatePostGuide(userId: number, data: UpdateCreatePostGuideDto) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung!');
    }

    await this.userRepo.update(user.id, {
      hasSeenCreatePostGuide: data.hasSeenCreatePostGuide,
    });

    return {
      message: 'Cap nhat trang thai huong dan dang tin thanh cong!',
      hasSeenCreatePostGuide: data.hasSeenCreatePostGuide,
    };
  }

  async updateVerify(userId: number, isVerified: boolean) {
    await this.userRepo.update(userId, {
      isVerified,
    });
  }

  async updateSocialGoogle(userId: number, googleId: string) {
    await this.userRepo.update(userId, {
      googleId,
    });
  }

  async update2fa(
    userId: number,
    isEnabled: boolean,
    method?: UserTwoFactorMethod,
  ) {
    await this.userRepo.update(userId, {
      two_factor_enabled: isEnabled,
      ...(method ? { two_factor_method: method } : {}),
    });
  }

  async changeEmail(userId: number, newEmail: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    if (user.email === newEmail) {
      throw new BadRequestException('Email mới trùng email hiện tại!');
    }
    const existEmail = await this.findUserByEmail(newEmail);
    if (existEmail) {
      throw new BadRequestException(
        'Email đã được đăng ký bằng tài khoản khác.',
      );
    }

    try {
      await this.userRepo.update(user.id, {
        email: newEmail.trim().toLowerCase(),
      });
    } catch (error: any) {
      if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'Email đã được đăng ký bằng tài khoản khác.',
        );
      }
      throw error;
    }
  }

  async changePhone(userId: number, newPhone: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    if (user.phone === newPhone) {
      throw new BadRequestException(
        'Số điện thoại mới trùng số điện thoại hiện tại!',
      );
    }
    const existEmail = await this.findUserByPhone(newPhone);
    if (existEmail) {
      throw new BadRequestException(
        'Số điện thoại đã được liên kết với tài khoản khác.',
      );
    }

    try {
      await this.userRepo.update(user.id, {
        phone: newPhone,
        phoneVerifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'Số điện thoại đã được liên kết với tài khoản khác.',
        );
      }
      throw error;
    }
  }

  async updatePassword(email: string, newPassword: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    await this.userRepo.update(user.id, {
      password: newPassword,
    });
  }

  async deleteAccount(userId: number) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Khong tim thay nguoi dung!');
      }

      const posts = await manager.find(Post, {
        where: { userId },
        select: {
          id: true,
        },
      });
      const postIds = posts.map((post) => post.id);

      await manager.delete(Message, { senderId: userId });

      if (postIds.length > 0) {
        const conversations = await manager.find(Conversation, {
          where: { postId: In(postIds) },
          select: { id: true },
        });
        const conversationIds = conversations.map(
          (conversation) => conversation.id,
        );

        if (conversationIds.length > 0) {
          await manager.delete(Message, {
            conversationId: In(conversationIds),
          });
        }

        await manager
          .createQueryBuilder()
          .delete()
          .from(Review)
          .where('postId IN (:...postIds)', { postIds })
          .orWhere('reviewerId = :userId', { userId })
          .orWhere('revieweeId = :userId', { userId })
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from(Report)
          .where('reporterId = :userId', { userId })
          .orWhere('targetType = :userTargetType AND targetId = :userId', {
            userTargetType: TargetType.USER,
            userId,
          })
          .orWhere(
            'targetType = :postTargetType AND targetId IN (:...postIds)',
            {
              postTargetType: TargetType.POST,
              postIds,
            },
          )
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from(SavedPost)
          .where('userId = :userId', { userId })
          .orWhere('postId IN (:...postIds)', { postIds })
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from(Conversation)
          .where('buyerId = :userId', { userId })
          .orWhere('sellerId = :userId', { userId })
          .orWhere('postId IN (:...postIds)', { postIds })
          .execute();

        await manager.delete(PostImage, { postId: In(postIds) });
        await manager.delete(Post, { id: In(postIds) });
      } else {
        await manager
          .createQueryBuilder()
          .delete()
          .from(Review)
          .where('reviewerId = :userId', { userId })
          .orWhere('revieweeId = :userId', { userId })
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from(Report)
          .where('reporterId = :userId', { userId })
          .orWhere('targetType = :userTargetType AND targetId = :userId', {
            userTargetType: TargetType.USER,
            userId,
          })
          .execute();

        await manager.delete(SavedPost, { userId });

        await manager
          .createQueryBuilder()
          .delete()
          .from(Conversation)
          .where('buyerId = :userId', { userId })
          .orWhere('sellerId = :userId', { userId })
          .execute();
      }

      await manager.delete(Notification, { userId });
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserAddress)
        .where('user_id = :userId', { userId })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserVerification)
        .where('user_id = :userId', { userId })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserSession)
        .where('userId = :userId', { userId })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserIdentity)
        .where('user_id = :userId', { userId })
        .execute();
      await manager.delete(User, userId);
    });

    return {
      message: 'Xoa tai khoan thanh cong!',
    };
  }

  async banUser(adminId: number, id: number, reason?: string) {
    try {
      if (adminId === id) {
        throw new BadRequestException('Khong the ban chinh minh');
      }

      const banReason = reason?.trim();
      if (!banReason) {
        throw new BadRequestException('Vui long nhap ly do khoa nguoi dung');
      }

      const admin = await this.userRepo.findOne({
        where: { id: adminId, role: UserRole.ADMIN },
      });
      if (!admin) {
        throw new BadRequestException('Ban khong co quyen khoa nguoi dung');
      }

      const user = await this.userRepo.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }

      if (user.role !== UserRole.USER) {
        throw new BadRequestException('Chi co the khoa nguoi dung thuong');
      }

      await this.userRepo.update(id, {
        status: UserStatus.BANNED,
        banReason,
      });
      await this.dataSource
        .getRepository(UserSession)
        .update({ user: { id } }, { revokedAt: new Date() });

      return {
        message: 'Đã ban người dùng!',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server:  ${err.message}`);
    }
  }

  async unbanUser(adminId: number, id: number) {
    try {
      if (adminId === id) {
        throw new BadRequestException('Khong the mo khoa chinh minh');
      }

      const admin = await this.userRepo.findOne({
        where: {
          id: adminId,
          role: UserRole.ADMIN,
        },
      });

      if (!admin) {
        throw new BadRequestException('Ban khong co quyen mo khoa nguoi dung');
      }

      const user = await this.userRepo.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Khong tim thay nguoi dung');
      }

      if (user.role !== UserRole.USER) {
        throw new BadRequestException('Chi co the mo khoa nguoi dung thuong');
      }

      await this.userRepo.update(id, {
        status: UserStatus.ACTIVE,
        banReason: undefined,
      });

      return {
        message: 'Da mo khoa nguoi dung',
      };
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(`Loi server:  ${err.message}`);
    }
  }

  private toPublicUser(user: User) {
    const publicUser = {
      ...user,
      email: user.showEmail ? user.email : null,
      phone: user.showPhone ? user.phone : null,
    };
    delete publicUser.password;
    return publicUser;
  }

  private toAdminUser(user: User) {
    const adminUser = {
      ...user,
    };
    delete adminUser.password;
    return adminUser;
  }
}
