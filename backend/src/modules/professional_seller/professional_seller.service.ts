import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ProfessionalSellerStatus,
  SellerType,
  PostStatus,
  IdentityStatus,
  NotificationType,
  UserRole,
} from 'src/shared';
import { DataSource, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { CreateProfessionalSellerDto } from './dto/create-professional-seller.dto';
import { UpdateProfessionalSellerDto } from './dto/update-professional-seller.dto';
import { ProfessionalSellerProfile } from './entities/professional_seller_profile.entity';
import { AddressService } from '../address/address.service';
import { NotificationService } from '../notification/notification.service';

interface ProfessionalSellerFiles {
  businessLicense?: Express.Multer.File[];
  logo?: Express.Multer.File[];
  cover?: Express.Multer.File[];
}

@Injectable()
export class ProfessionalSellerService {
  constructor(
    @InjectRepository(ProfessionalSellerProfile)
    private readonly profileRepo: Repository<ProfessionalSellerProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    private readonly addressService: AddressService,
    private readonly notificationService: NotificationService,
  ) {}

  private getFile(
    files: ProfessionalSellerFiles,
    key: keyof ProfessionalSellerFiles,
  ) {
    return files[key]?.[0];
  }

  private validateImage(file?: Express.Multer.File) {
    if (!file) return;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Mỗi ảnh không được vượt quá 5MB');
    }
  }

  async submit(
    userId: number,
    data: CreateProfessionalSellerDto,
    files: ProfessionalSellerFiles,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { identity: true },
    });
    if (!user?.isVerified) {
      throw new BadRequestException(
        'Vui lòng xác minh email trước khi đăng ký người bán chuyên',
      );
    }
    if (!user.identity || user.identity.status !== IdentityStatus.APPROVED) {
      throw new BadRequestException(
        'Vui lòng hoàn tất xác minh danh tính trước khi đăng ký người bán chuyên',
      );
    }
    if (
      !this.addressService.isValidAddress(
        data.province,
        data.district,
        data.ward,
      )
    ) {
      throw new BadRequestException('Địa chỉ cửa hàng không hợp lệ');
    }

    const existing = await this.profileRepo.findOne({ where: { userId } });
    const businessLicense = this.getFile(files, 'businessLicense');
    const logo = this.getFile(files, 'logo');
    const cover = this.getFile(files, 'cover');

    this.validateImage(businessLicense);
    this.validateImage(logo);
    this.validateImage(cover);

    if (
      (!existing || existing.status === ProfessionalSellerStatus.REJECTED) &&
      !businessLicense
    ) {
      throw new BadRequestException('Vui lòng tải giấy phép kinh doanh');
    }

    if (
      existing?.status === ProfessionalSellerStatus.PENDING ||
      existing?.status === ProfessionalSellerStatus.APPROVED ||
      existing?.status === ProfessionalSellerStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        existing.status === ProfessionalSellerStatus.PENDING
          ? 'Hồ sơ đang chờ xét duyệt'
          : existing.status === ProfessionalSellerStatus.APPROVED
            ? 'Tài khoản đã là người bán chuyên'
            : 'Hồ sơ đã bị đình chỉ, vui lòng liên hệ quản trị viên',
      );
    }

    const duplicateTaxCode = await this.profileRepo.findOne({
      where: { taxCode: data.taxCode.trim() },
    });
    if (duplicateTaxCode && duplicateTaxCode.userId !== userId) {
      throw new BadRequestException('Mã số thuế đã được sử dụng');
    }

    const uploads = await Promise.all([
      businessLicense
        ? this.cloudinaryService.uploadSingleFile(businessLicense)
        : undefined,
      logo ? this.cloudinaryService.uploadSingleFile(logo) : undefined,
      cover ? this.cloudinaryService.uploadSingleFile(cover) : undefined,
    ]);
    const [licenseUpload, logoUpload, coverUpload] = uploads;

    if (existing) {
      const oldPublicIds = [
        licenseUpload ? existing.businessLicensePublicId : undefined,
        logoUpload ? existing.logoPublicId : undefined,
        coverUpload ? existing.coverPublicId : undefined,
      ].filter((value): value is string => Boolean(value));

      Object.assign(existing, {
        ...data,
        storeName: data.storeName.trim(),
        taxCode: data.taxCode.trim(),
        status: ProfessionalSellerStatus.PENDING,
        rejectedReason: undefined,
        verifiedAt: undefined,
        verifiedBy: undefined,
        ...(licenseUpload
          ? {
              businessLicenseUrl: licenseUpload.url,
              businessLicensePublicId: licenseUpload.publicId,
            }
          : {}),
        ...(logoUpload
          ? { logoUrl: logoUpload.url, logoPublicId: logoUpload.publicId }
          : {}),
        ...(coverUpload
          ? { coverUrl: coverUpload.url, coverPublicId: coverUpload.publicId }
          : {}),
      });
      await this.profileRepo.save(existing);
      await this.notifyAdminsAboutApplication(existing, true);
      if (oldPublicIds.length) {
        await this.cloudinaryService.deleteFiles(oldPublicIds);
      }
      return {
        message: 'Đã gửi lại hồ sơ người bán chuyên',
        data: existing,
      };
    }

    const profile = this.profileRepo.create({
      ...data,
      storeName: data.storeName.trim(),
      taxCode: data.taxCode.trim(),
      businessLicenseUrl: licenseUpload!.url,
      businessLicensePublicId: licenseUpload!.publicId,
      logoUrl: logoUpload?.url,
      logoPublicId: logoUpload?.publicId,
      coverUrl: coverUpload?.url,
      coverPublicId: coverUpload?.publicId,
      userId,
    });
    await this.profileRepo.save(profile);
    await this.notifyAdminsAboutApplication(profile, false);

    return {
      message: 'Đã gửi hồ sơ người bán chuyên, vui lòng chờ xét duyệt',
      data: profile,
    };
  }

  private async notifyAdminsAboutApplication(
    profile: ProfessionalSellerProfile,
    isResubmission: boolean,
  ) {
    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          userId: admin.id,
          title: isResubmission
            ? 'Hồ sơ người bán chuyên được gửi lại'
            : 'Có hồ sơ người bán chuyên mới',
          content: `Cửa hàng ${profile.storeName} ${isResubmission ? 'vừa gửi lại' : 'vừa gửi'} hồ sơ đăng ký người bán chuyên.`,
          type: NotificationType.NEW_PROFESSIONAL_SELLER_APPLICATION,
          referenceId: profile.id,
        }),
      ),
    );
  }

  async getMine(userId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    return {
      message: 'Lấy hồ sơ người bán chuyên thành công',
      data: profile,
    };
  }

  async updateMine(
    userId: number,
    data: UpdateProfessionalSellerDto,
    files: ProfessionalSellerFiles,
  ) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile || profile.status !== ProfessionalSellerStatus.APPROVED) {
      throw new BadRequestException(
        'Chỉ người bán chuyên đã xác minh mới có thể cập nhật cửa hàng',
      );
    }

    if (
      !this.addressService.isValidAddress(
        data.province,
        data.district,
        data.ward,
      )
    ) {
      throw new BadRequestException('Địa chỉ cửa hàng không hợp lệ');
    }

    const logo = this.getFile(files, 'logo');
    const cover = this.getFile(files, 'cover');
    this.validateImage(logo);
    this.validateImage(cover);

    const [logoUpload, coverUpload] = await Promise.all([
      logo ? this.cloudinaryService.uploadSingleFile(logo) : undefined,
      cover ? this.cloudinaryService.uploadSingleFile(cover) : undefined,
    ]);
    const oldPublicIds = [
      logoUpload ? profile.logoPublicId : undefined,
      coverUpload ? profile.coverPublicId : undefined,
    ].filter((value): value is string => Boolean(value));

    Object.assign(profile, {
      ...data,
      description: data.description || undefined,
      ward: data.ward || undefined,
      website: data.website || undefined,
      ...(logoUpload
        ? { logoUrl: logoUpload.url, logoPublicId: logoUpload.publicId }
        : {}),
      ...(coverUpload
        ? { coverUrl: coverUpload.url, coverPublicId: coverUpload.publicId }
        : {}),
    });
    await this.profileRepo.save(profile);
    if (oldPublicIds.length) {
      await this.cloudinaryService.deleteFiles(oldPublicIds);
    }

    return {
      message: 'Đã cập nhật thông tin cửa hàng',
      data: profile,
    };
  }

  async requestLegalChange(userId: number, reason: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile || profile.status !== ProfessionalSellerStatus.APPROVED) {
      throw new BadRequestException(
        'Chỉ cửa hàng đã xác minh mới có thể yêu cầu thay đổi pháp lý',
      );
    }

    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          userId: admin.id,
          title: 'Yêu cầu thay đổi thông tin pháp lý',
          content: `Cửa hàng ${profile.storeName} yêu cầu thay đổi thông tin pháp lý: ${reason.trim()}`,
          type: NotificationType.NEW_PROFESSIONAL_SELLER_APPLICATION,
          referenceId: profile.id,
        }),
      ),
    );

    return { message: 'Đã gửi yêu cầu thay đổi thông tin pháp lý' };
  }

  async getPublic(id: number) {
    const profile = await this.profileRepo.findOne({
      where: { id, status: ProfessionalSellerStatus.APPROVED },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    const activePostCount = await this.postRepo.count({
      where: { userId: profile.userId, status: PostStatus.ACTIVE },
    });

    return {
      message: 'Lấy thông tin cửa hàng thành công',
      data: {
        id: profile.id,
        userId: profile.userId,
        storeName: profile.storeName,
        description: profile.description,
        logoUrl: profile.logoUrl,
        coverUrl: profile.coverUrl,
        province: profile.province,
        district: profile.district,
        ward: profile.ward,
        addressDetail: profile.addressDetail,
        website: profile.website,
        verifiedAt: profile.verifiedAt,
        activePostCount,
        phone: profile.user.showPhone ? profile.user.phone : undefined,
        email: profile.user.showEmail ? profile.user.email : undefined,
      },
    };
  }

  async getPublicPosts(id: number) {
    const profile = await this.profileRepo.findOne({
      where: { id, status: ProfessionalSellerStatus.APPROVED },
      select: { id: true, userId: true },
    });
    if (!profile) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    const posts = await this.postRepo.find({
      where: { userId: profile.userId, status: PostStatus.ACTIVE },
      relations: { vehicle: true, post_images: true, category: true },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Lấy danh sách xe của cửa hàng thành công',
      data: posts,
    };
  }

  async getApplications(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const status = query.status as ProfessionalSellerStatus | undefined;
    const where =
      status && Object.values(ProfessionalSellerStatus).includes(status)
        ? { status }
        : {};

    const [items, total] = await this.profileRepo.findAndCount({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      message: 'Lấy danh sách hồ sơ người bán chuyên thành công',
      data: {
        items: items.map((item) => ({
          ...item,
          user: {
            id: item.user.id,
            fullName: item.user.fullName,
            email: item.user.email,
            phone: item.user.phone,
          },
        })),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    };
  }

  async approve(adminId: number, id: number) {
    const profile = await this.dataSource.transaction(async (manager) => {
      const lockedProfile = await manager.findOne(ProfessionalSellerProfile, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedProfile) {
        throw new NotFoundException('Không tìm thấy hồ sơ');
      }
      if (lockedProfile.status !== ProfessionalSellerStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể duyệt hồ sơ đang chờ');
      }

      lockedProfile.status = ProfessionalSellerStatus.APPROVED;
      lockedProfile.verifiedAt = new Date();
      lockedProfile.verifiedBy = adminId;
      lockedProfile.rejectedReason = undefined;
      await manager.save(lockedProfile);
      await manager.update(User, lockedProfile.userId, {
        sellerType: SellerType.PROFESSIONAL,
      });
      return lockedProfile;
    });

    return { message: 'Đã duyệt người bán chuyên', data: profile };
  }

  async reject(adminId: number, id: number, reason?: string) {
    const rejectedReason = reason?.trim();
    if (!rejectedReason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }
    const profile = await this.dataSource.transaction(async (manager) => {
      const lockedProfile = await manager.findOne(ProfessionalSellerProfile, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedProfile) {
        throw new NotFoundException('Không tìm thấy hồ sơ');
      }
      if (lockedProfile.status !== ProfessionalSellerStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể từ chối hồ sơ đang chờ');
      }

      lockedProfile.status = ProfessionalSellerStatus.REJECTED;
      lockedProfile.rejectedReason = rejectedReason;
      lockedProfile.verifiedAt = undefined;
      lockedProfile.verifiedBy = adminId;
      await manager.save(lockedProfile);
      await manager.update(User, lockedProfile.userId, {
        sellerType: SellerType.INDIVIDUAL,
      });
      return lockedProfile;
    });

    return { message: 'Đã từ chối hồ sơ người bán chuyên', data: profile };
  }

  async suspend(adminId: number, id: number, reason?: string) {
    const suspendedReason = reason?.trim();
    if (!suspendedReason) {
      throw new BadRequestException('Vui lòng nhập lý do đình chỉ');
    }
    const profile = await this.dataSource.transaction(async (manager) => {
      const lockedProfile = await manager.findOne(ProfessionalSellerProfile, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedProfile) {
        throw new NotFoundException('Không tìm thấy hồ sơ');
      }
      if (lockedProfile.status !== ProfessionalSellerStatus.APPROVED) {
        throw new BadRequestException('Chỉ có thể đình chỉ hồ sơ đã duyệt');
      }

      lockedProfile.status = ProfessionalSellerStatus.SUSPENDED;
      lockedProfile.rejectedReason = suspendedReason;
      lockedProfile.verifiedBy = adminId;
      await manager.save(lockedProfile);
      await manager.update(User, lockedProfile.userId, {
        sellerType: SellerType.PROFESSIONAL,
      });
      return lockedProfile;
    });

    return { message: 'Đã đình chỉ người bán chuyên', data: profile };
  }
}
