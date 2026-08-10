import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityStatus, IdType, NotificationType, UserRole } from 'src/shared';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { UserIdentity } from './entities/user_identity.entity';
import { User } from '../user/entities/user.entity';
import { UserStatus } from 'src/shared';
import { NotificationService } from '../notification/notification.service';

interface IdentityFiles {
  idFront?: Express.Multer.File[];
  idBack?: Express.Multer.File[];
}

@Injectable()
export class UserIdentityService {
  constructor(
    @InjectRepository(UserIdentity)
    private readonly identityRepo: Repository<UserIdentity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  private validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên đầy đủ ảnh giấy tờ mẫu');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Mỗi ảnh không được vượt quá 5MB');
    }
  }

  private validateIdentity(data: CreateUserIdentityDto) {
    const today = new Date();
    const dateOfBirth = new Date(data.dateOfBirth);
    const issueDate = new Date(data.issueDate);
    if (dateOfBirth >= today) {
      throw new BadRequestException('Ngày sinh không hợp lệ');
    }
    if (issueDate > today || issueDate <= dateOfBirth) {
      throw new BadRequestException('Ngày cấp giấy tờ không hợp lệ');
    }
    if (data.idType === IdType.CCCD && !/^000\d{9}$/.test(data.idNumber)) {
      throw new BadRequestException(
        'CCCD mô phỏng phải gồm 12 chữ số và bắt đầu bằng 000',
      );
    }
    if (
      data.idType === IdType.PASSPORT &&
      !/^DEMO[A-Z0-9]{2,16}$/i.test(data.idNumber)
    ) {
      throw new BadRequestException('Hộ chiếu mô phỏng phải bắt đầu bằng DEMO');
    }
  }

  async getMine(userId: number) {
    const identity = await this.identityRepo.findOne({ where: { userId } });
    return {
      message: 'Lấy hồ sơ xác minh danh tính thành công',
      data: identity,
    };
  }

  async getMineImages(userId: number) {
    const identity = await this.identityRepo
      .createQueryBuilder('identity')
      .addSelect(['identity.idFrontUrl', 'identity.idBackUrl'])
      .where('identity.userId = :userId', { userId })
      .getOne();
    return {
      data: identity
        ? {
            idFrontUrl: identity.idFrontUrl,
            idBackUrl: identity.idBackUrl,
          }
        : null,
    };
  }

  async submit(
    userId: number,
    data: CreateUserIdentityDto,
    files: IdentityFiles,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản không hợp lệ hoặc đã bị khóa');
    }
    if (!user.isVerified) {
      throw new BadRequestException(
        'Vui lòng xác minh email trước khi xác minh danh tính',
      );
    }
    if (!user.phone || !user.phoneVerifiedAt) {
      throw new BadRequestException(
        'Vui lòng xác minh số điện thoại trước khi xác minh danh tính',
      );
    }
    if (data.demoConsent !== true) {
      throw new BadRequestException(
        'Bạn phải xác nhận chỉ sử dụng dữ liệu mô phỏng',
      );
    }
    this.validateIdentity(data);
    const idFront = files.idFront?.[0];
    const idBack = files.idBack?.[0];
    this.validateFile(idFront);
    this.validateFile(idBack);

    const existing = await this.identityRepo
      .createQueryBuilder('identity')
      .addSelect([
        'identity.idFrontPublicId',
        'identity.idBackPublicId',
        'identity.selfiePublicId',
        'identity.idFrontUrl',
        'identity.idBackUrl',
        'identity.selfieUrl',
      ])
      .where('identity.userId = :userId', { userId })
      .getOne();
    if (
      existing &&
      [
        IdentityStatus.PENDING,
        IdentityStatus.PROCESSING,
        IdentityStatus.APPROVED,
      ].includes(existing.status)
    ) {
      const messages = {
        [IdentityStatus.PENDING]: 'Hồ sơ đang chờ xét duyệt',
        [IdentityStatus.PROCESSING]: 'Hồ sơ đang được xử lý',
        [IdentityStatus.APPROVED]: 'Danh tính đã được xác minh',
      };
      throw new BadRequestException(messages[existing.status]);
    }

    const duplicate = await this.identityRepo.findOne({
      where: { idNumber: data.idNumber, idType: data.idType },
    });
    if (duplicate && duplicate.userId !== userId) {
      throw new BadRequestException('Giấy tờ này đã được sử dụng');
    }

    const [frontUpload, backUpload] = await Promise.all([
      this.cloudinaryService.uploadSingleFile(idFront!),
      this.cloudinaryService.uploadSingleFile(idBack!),
    ]);

    if (existing) {
      const oldPublicIds = [
        existing.idFrontPublicId,
        existing.idBackPublicId,
        existing.selfiePublicId,
      ].filter((value): value is string => Boolean(value));
      Object.assign(existing, {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        issueDate: new Date(data.issueDate),
        idFrontUrl: frontUpload.url,
        idFrontPublicId: frontUpload.publicId,
        idBackUrl: backUpload.url,
        idBackPublicId: backUpload.publicId,
        selfieUrl: null,
        selfiePublicId: null,
        status: IdentityStatus.PENDING,
        confidenceScore: 0,
        verifiedAt: undefined,
        rejectionReason: undefined,
      });
      await this.identityRepo.save(existing);
      await this.notifyAdminsAboutApplication(existing, true);
      if (oldPublicIds.length) {
        await this.cloudinaryService.deleteFiles(oldPublicIds);
      }
      const saved = await this.identityRepo.findOne({ where: { userId } });
      return { message: 'Đã gửi lại hồ sơ xác minh', data: saved };
    }

    const identity = this.identityRepo.create({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      issueDate: new Date(data.issueDate),
      userId,
      idFrontUrl: frontUpload.url,
      idFrontPublicId: frontUpload.publicId,
      idBackUrl: backUpload.url,
      idBackPublicId: backUpload.publicId,
      selfieUrl: null,
      selfiePublicId: null,
      status: IdentityStatus.PENDING,
    });
    await this.identityRepo.save(identity);
    await this.notifyAdminsAboutApplication(identity, false);
    const saved = await this.identityRepo.findOne({ where: { userId } });
    return { message: 'Đã gửi hồ sơ xác minh danh tính', data: saved };
  }

  async getApplications(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const status = query.status as IdentityStatus | undefined;
    if (status && !Object.values(IdentityStatus).includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const builder = this.identityRepo
      .createQueryBuilder('identity')
      .leftJoin('identity.user', 'user')
      .addSelect([
        'identity.idFrontUrl',
        'identity.idBackUrl',
        'identity.selfieUrl',
      ])
      .addSelect(['user.id', 'user.fullName', 'user.email', 'user.phone'])
      .orderBy('identity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) {
      builder.andWhere('identity.status = :status', { status });
    }
    const [data, total] = await builder.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(
    userId: number,
    data: CreateUserIdentityDto,
    files: IdentityFiles,
  ) {
    if (data.demoConsent !== true) {
      throw new BadRequestException(
        'Bạn phải xác nhận chỉ sử dụng dữ liệu mô phỏng',
      );
    }
    this.validateIdentity(data);
    const identity = await this.identityRepo
      .createQueryBuilder('identity')
      .addSelect([
        'identity.idFrontUrl',
        'identity.idBackUrl',
        'identity.idFrontPublicId',
        'identity.idBackPublicId',
      ])
      .where('identity.userId = :userId', { userId })
      .getOne();
    if (!identity) throw new NotFoundException('Không tìm thấy hồ sơ xác minh');
    if (identity.status !== IdentityStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể cập nhật hồ sơ đang chờ xét duyệt',
      );
    }
    const duplicate = await this.identityRepo.findOne({
      where: { idNumber: data.idNumber, idType: data.idType },
    });
    if (duplicate && duplicate.userId !== userId) {
      throw new BadRequestException('Giấy tờ này đã được sử dụng');
    }

    const idFront = files.idFront?.[0];
    const idBack = files.idBack?.[0];
    if (idFront) this.validateFile(idFront);
    if (idBack) this.validateFile(idBack);
    const [frontUpload, backUpload] = await Promise.all([
      idFront ? this.cloudinaryService.uploadSingleFile(idFront) : null,
      idBack ? this.cloudinaryService.uploadSingleFile(idBack) : null,
    ]);
    const replacedPublicIds = [
      frontUpload ? identity.idFrontPublicId : null,
      backUpload ? identity.idBackPublicId : null,
    ].filter((value): value is string => Boolean(value));
    Object.assign(identity, {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      issueDate: new Date(data.issueDate),
      ...(frontUpload
        ? {
            idFrontUrl: frontUpload.url,
            idFrontPublicId: frontUpload.publicId,
          }
        : {}),
      ...(backUpload
        ? {
            idBackUrl: backUpload.url,
            idBackPublicId: backUpload.publicId,
          }
        : {}),
      confidenceScore: 0,
      verifiedAt: undefined,
      rejectionReason: undefined,
    });
    await this.identityRepo.save(identity);
    await this.notifyAdminsAboutApplication(identity, true);
    if (replacedPublicIds.length) {
      await this.cloudinaryService.deleteFiles(replacedPublicIds);
    }
    const saved = await this.identityRepo.findOne({ where: { userId } });
    return { message: 'Đã cập nhật hồ sơ xác minh', data: saved };
  }

  async markProcessing(id: number) {
    const identity = await this.getReviewable(id);
    if (identity.status !== IdentityStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể tiếp nhận hồ sơ đang chờ duyệt',
      );
    }
    identity.status = IdentityStatus.PROCESSING;
    identity.rejectionReason = undefined;
    await this.identityRepo.save(identity);
    await this.notifyStatusUpdate(
      identity,
      'Hồ sơ xác minh đang được xử lý',
      'Hồ sơ xác minh danh tính của bạn đã được quản trị viên tiếp nhận và đang được kiểm tra.',
    );
    return { message: 'Đã tiếp nhận hồ sơ', data: identity };
  }

  async approve(id: number) {
    const identity = await this.getReviewable(id);
    if (
      ![IdentityStatus.PENDING, IdentityStatus.PROCESSING].includes(
        identity.status,
      )
    ) {
      throw new BadRequestException('Hồ sơ không thể được phê duyệt');
    }
    await this.removeIdentityImages(identity);
    identity.status = IdentityStatus.APPROVED;
    identity.verifiedAt = new Date();
    identity.rejectionReason = undefined;
    identity.confidenceScore = 1;
    await this.identityRepo.save(identity);
    await this.notifyStatusUpdate(
      identity,
      'Xác minh danh tính thành công',
      'Hồ sơ của bạn đã được phê duyệt. Tài khoản hiện đã được xác minh danh tính.',
    );
    return { message: 'Đã xác minh danh tính', data: identity };
  }

  async reject(id: number, reason: string) {
    const identity = await this.getReviewable(id);
    if (
      ![IdentityStatus.PENDING, IdentityStatus.PROCESSING].includes(
        identity.status,
      )
    ) {
      throw new BadRequestException('Hồ sơ không thể bị từ chối');
    }
    await this.removeIdentityImages(identity);
    identity.status = IdentityStatus.REJECTED;
    identity.rejectionReason = reason;
    identity.verifiedAt = undefined;
    identity.confidenceScore = 0;
    await this.identityRepo.save(identity);
    await this.notifyStatusUpdate(
      identity,
      'Hồ sơ xác minh bị từ chối',
      `Hồ sơ xác minh danh tính của bạn đã bị từ chối. Lý do: ${reason}`,
    );
    return { message: 'Đã từ chối hồ sơ', data: identity };
  }

  private async notifyAdminsAboutApplication(
    identity: UserIdentity,
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
            ? 'Hồ sơ xác minh danh tính được cập nhật'
            : 'Có hồ sơ xác minh danh tính mới',
          content: `${identity.fullName} ${isResubmission ? 'vừa cập nhật' : 'vừa gửi'} hồ sơ xác minh danh tính.`,
          type: NotificationType.NEW_IDENTITY_APPLICATION,
          referenceId: identity.id,
        }),
      ),
    );
  }

  private async notifyStatusUpdate(
    identity: UserIdentity,
    title: string,
    content: string,
  ) {
    await this.notificationService.createNotification({
      userId: identity.userId,
      title,
      content,
      type: NotificationType.IDENTITY_STATUS_UPDATED,
      referenceId: identity.id,
    });
  }

  private async getReviewable(id: number) {
    const identity = await this.identityRepo
      .createQueryBuilder('identity')
      .addSelect([
        'identity.idFrontUrl',
        'identity.idBackUrl',
        'identity.selfieUrl',
        'identity.idFrontPublicId',
        'identity.idBackPublicId',
        'identity.selfiePublicId',
      ])
      .where('identity.id = :id', { id })
      .getOne();
    if (!identity) {
      throw new NotFoundException('Không tìm thấy hồ sơ xác minh');
    }
    return identity;
  }

  private async removeIdentityImages(identity: UserIdentity) {
    const publicIds = [
      identity.idFrontPublicId,
      identity.idBackPublicId,
      identity.selfiePublicId,
    ].filter((value): value is string => Boolean(value));
    if (publicIds.length) await this.cloudinaryService.deleteFiles(publicIds);
    identity.idFrontUrl = null;
    identity.idBackUrl = null;
    identity.selfieUrl = null;
    identity.idFrontPublicId = null;
    identity.idBackPublicId = null;
    identity.selfiePublicId = null;
  }
}
