import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { hashPass } from 'src/utils/handlePassword';
import {
  TargetType,
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
        email: user.email,
        avatar: user.avatar,
        role: user.role,
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
        email,
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
    const { email, password } = dataRegister;
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
            token: verifyToken,
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
            error.code === 'ER_DUP_ENTRY'
          ) {
            throw new BadRequestException('Email đã tồn tại!');
          }
          throw error;
        }
      },
    );
    try {
      await this.mailService.sendOtp(email, verifyToken);
    } catch (error) {
      console.log('Send mail failed', error);
    }

    return newUser;
  }

  async getAllUsers() {
    try {
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

  async getUserById(id: number) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          id,
        },
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

  async updateAvatar(id: number, avatar?: Express.Multer.File) {
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

  async updateUserBasic(id: number, dataUpdate: UpdateUserDto) {
    return await this.dataSource.transaction(async (manager) => {
      const { addressId, birthday, fullName, gender, personalInfo } =
        dataUpdate;
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

    await this.userRepo.update(user.id, {
      email: newEmail,
    });
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

    await this.userRepo.update(user.id, {
      phone: newPhone,
    });
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
          await manager.delete(Message, { conversationId: In(conversationIds) });
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
          .orWhere('targetType = :postTargetType AND targetId IN (:...postIds)', {
            postTargetType: TargetType.POST,
            postIds,
          })
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

  async banUser(id: number) {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }

      await this.userRepo.update(id, {
        status: UserStatus.BANNED,
      });

      return {
        message: 'Đã ban người dùng!',
      };
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server:  ${err.message}`);
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
}
