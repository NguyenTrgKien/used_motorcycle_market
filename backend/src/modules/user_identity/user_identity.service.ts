import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityStatus, IdType } from 'src/shared';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { UserIdentity } from './entities/user_identity.entity';
import { User } from '../user/entities/user.entity';
import { UserStatus } from 'src/shared';

interface IdentityFiles {
  idFront?: Express.Multer.File[];
  idBack?: Express.Multer.File[];
  selfie?: Express.Multer.File[];
}

@Injectable()
export class UserIdentityService {
  constructor(
    @InjectRepository(UserIdentity)
    private readonly identityRepo: Repository<UserIdentity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên đầy đủ 3 ảnh xác minh');
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
    if (data.idType === IdType.CCCD && !/^\d{12}$/.test(data.idNumber)) {
      throw new BadRequestException('Số CCCD phải gồm đúng 12 chữ số');
    }
    if (
      data.idType === IdType.PASSPORT &&
      !/^[A-Z0-9]{6,20}$/i.test(data.idNumber)
    ) {
      throw new BadRequestException('Số hộ chiếu không hợp lệ');
    }
  }

  async getMine(userId: number) {
    const identity = await this.identityRepo.findOne({ where: { userId } });
    return {
      message: 'Lấy hồ sơ xác minh danh tính thành công',
      data: identity,
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
      throw new BadRequestException('Vui lòng xác minh email trước khi xác minh danh tính');
    }
    if (!user.phone || !user.phoneVerifiedAt) {
      throw new BadRequestException('Vui lòng xác minh số điện thoại trước khi xác minh danh tính');
    }
    this.validateIdentity(data);
    const idFront = files.idFront?.[0];
    const idBack = files.idBack?.[0];
    const selfie = files.selfie?.[0];
    this.validateFile(idFront);
    this.validateFile(idBack);
    this.validateFile(selfie);

    const existing = await this.identityRepo
      .createQueryBuilder('identity')
      .addSelect([
        'identity.idFrontPublicId',
        'identity.idBackPublicId',
        'identity.selfiePublicId',
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

    const [frontUpload, backUpload, selfieUpload] = await Promise.all([
      this.cloudinaryService.uploadSingleFile(idFront!),
      this.cloudinaryService.uploadSingleFile(idBack!),
      this.cloudinaryService.uploadSingleFile(selfie!),
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
        selfieUrl: selfieUpload.url,
        selfiePublicId: selfieUpload.publicId,
        status: IdentityStatus.PENDING,
        confidenceScore: 0,
        verifiedAt: undefined,
        rejectionReason: undefined,
      });
      await this.identityRepo.save(existing);
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
      selfieUrl: selfieUpload.url,
      selfiePublicId: selfieUpload.publicId,
      status: IdentityStatus.PENDING,
    });
    await this.identityRepo.save(identity);
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
    identity.status = IdentityStatus.APPROVED;
    identity.verifiedAt = new Date();
    identity.rejectionReason = undefined;
    identity.confidenceScore = 1;
    await this.identityRepo.save(identity);
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
    identity.status = IdentityStatus.REJECTED;
    identity.rejectionReason = reason;
    identity.verifiedAt = undefined;
    identity.confidenceScore = 0;
    await this.identityRepo.save(identity);
    return { message: 'Đã từ chối hồ sơ', data: identity };
  }

  private async getReviewable(id: number) {
    const identity = await this.identityRepo.findOne({ where: { id } });
    if (!identity) {
      throw new NotFoundException('Không tìm thấy hồ sơ xác minh');
    }
    return identity;
  }
}
