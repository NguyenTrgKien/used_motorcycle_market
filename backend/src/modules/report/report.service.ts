import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';
import { NotificationType, ReportStatus, TargetType, UserRole } from 'src/shared';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(reporterId: number, dto: CreateReportDto) {
    if (dto.targetType === TargetType.USER) {
      if (dto.targetId === reporterId) throw new BadRequestException('Không thể báo cáo chính mình');
      if (!(await this.userRepo.exist({ where: { id: dto.targetId } }))) throw new NotFoundException('Không tìm thấy người dùng');
    } else {
      const post = await this.postRepo.findOne({ where: { id: dto.targetId }, select: { id: true, userId: true } });
      if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
      if (post.userId === reporterId) throw new BadRequestException('Không thể báo cáo tin của chính mình');
    }

    const duplicate = await this.reportRepo.findOne({
      where: { reporterId, targetId: dto.targetId, targetType: dto.targetType, status: ReportStatus.PENDING },
    });
    if (duplicate) throw new ConflictException('Bạn đã gửi báo cáo cho đối tượng này và đang chờ xử lý');

    const recentCount = await this.reportRepo
      .createQueryBuilder('report')
      .where('report.reporterId = :reporterId', { reporterId })
      .andWhere('report.createdAt >= :since', { since: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getCount();
    if (recentCount >= 10) throw new BadRequestException('Bạn đã đạt giới hạn 10 báo cáo trong 24 giờ');

    const report = await this.reportRepo.save(this.reportRepo.create({
      ...dto,
      reasonDetail: dto.reasonDetail.trim(),
      reporterId,
    }));
    const reviewers = await this.userRepo.find({ where: { role: In([UserRole.ADMIN, UserRole.CSKH]) }, select: { id: true } });
    await Promise.allSettled(reviewers.map((reviewer) => this.notificationService.createNotification({ userId: reviewer.id, title: 'Báo cáo vi phạm mới', content: `Có báo cáo mới về ${dto.targetType === TargetType.POST ? 'tin đăng' : 'người dùng'} #${dto.targetId}`, type: NotificationType.NEW_REPORT, referenceId: report.id })));
    return { message: 'Gửi báo cáo thành công', data: report };
  }

  findMine(reporterId: number, query: Record<string, string | undefined>) {
    return this.getList(query, reporterId);
  }

  async findMineOne(reporterId: number, id: number) {
    const report = await this.reportRepo.findOne({ where: { id, reporterId } });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return { message: 'Lấy chi tiết báo cáo thành công', data: await this.enrich([report]).then((items) => items[0]) };
  }

  findAll(query: Record<string, string | undefined>) {
    return this.getList(query);
  }

  async getStatus(reporterId: number, targetType: string, targetId: number) {
    if (!Object.values(TargetType).includes(targetType as TargetType)) {
      throw new BadRequestException('Loại đối tượng báo cáo không hợp lệ');
    }
    const report = await this.reportRepo.findOne({
      where: {
        reporterId,
        targetType: targetType as TargetType,
        targetId,
        status: ReportStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
    return {
      message: 'Kiểm tra trạng thái báo cáo thành công',
      data: {
        reported: Boolean(report),
        status: report?.status || null,
        reportId: report?.id || null,
      },
    };
  }

  async findOne(id: number) {
    const report = await this.reportRepo.findOne({ where: { id }, relations: { reporter: true } });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return { message: 'Lấy chi tiết báo cáo thành công', data: await this.enrich([report]).then((items) => items[0]) };
  }

  async update(id: number, dto: UpdateReportDto) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    if (dto.status === ReportStatus.PENDING) throw new BadRequestException('Không thể chuyển báo cáo về trạng thái chờ xử lý');
    if (!dto.note?.trim()) throw new BadRequestException('Vui lòng nhập ghi chú xử lý');
    report.status = dto.status;
    report.note = dto.note.trim();
    await this.reportRepo.save(report);
    await Promise.allSettled([this.notificationService.createNotification({ userId: report.reporterId, title: 'Kết quả báo cáo vi phạm', content: dto.status === ReportStatus.RESOLVED ? 'Báo cáo của bạn đã được xác nhận và xử lý' : 'Báo cáo của bạn đã được xem xét và từ chối', type: NotificationType.REPORT_STATUS_UPDATED, referenceId: report.id })]);
    return { message: 'Cập nhật báo cáo thành công', data: report };
  }

  async remove(id: number) {
    const result = await this.reportRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Không tìm thấy báo cáo');
    return { message: 'Xóa báo cáo thành công' };
  }

  private async getList(query: Record<string, string | undefined>, reporterId?: number) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const qb = this.reportRepo.createQueryBuilder('report').leftJoinAndSelect('report.reporter', 'reporter');
    if (reporterId) qb.andWhere('report.reporterId = :reporterId', { reporterId });
    if (query.status && Object.values(ReportStatus).includes(query.status as ReportStatus)) qb.andWhere('report.status = :status', { status: query.status });
    if (query.targetType && Object.values(TargetType).includes(query.targetType as TargetType)) qb.andWhere('report.targetType = :targetType', { targetType: query.targetType });
    if (query.targetId) {
      const targetId = Number(query.targetId);
      if (!Number.isInteger(targetId) || targetId < 1) throw new BadRequestException('Mã đối tượng báo cáo không hợp lệ');
      qb.andWhere('report.targetId = :targetId', { targetId });
    }
    if (query.reasonType) qb.andWhere('report.reasonType = :reasonType', { reasonType: query.reasonType });
    if (query.search?.trim()) qb.andWhere('(LOWER(report.reasonDetail) LIKE :search OR LOWER(reporter.fullName) LIKE :search OR LOWER(reporter.email) LIKE :search)', { search: `%${query.search.trim().toLowerCase()}%` });
    const [items, total] = await qb.orderBy('report.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { message: 'Lấy danh sách báo cáo thành công', data: { items: await this.enrich(items), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } };
  }

  private async enrich(reports: Report[]) {
    const postIds = reports.filter((item) => item.targetType === TargetType.POST).map((item) => item.targetId);
    const userIds = reports.filter((item) => item.targetType === TargetType.USER).map((item) => item.targetId);
    const [posts, users] = await Promise.all([
      postIds.length ? this.postRepo.find({ where: { id: In(postIds) }, select: { id: true, title: true, slug: true, userId: true } }) : [],
      userIds.length ? this.userRepo.find({ where: { id: In(userIds) }, select: { id: true, fullName: true, email: true, avatar: true, status: true } }) : [],
    ]);
    const postMap = new Map<number, Post>();
    const userMap = new Map<number, User>();
    posts.forEach((item) => postMap.set(item.id, item));
    users.forEach((item) => userMap.set(item.id, item));
    return reports.map((report) => ({ ...report, target: report.targetType === TargetType.POST ? postMap.get(report.targetId) || null : userMap.get(report.targetId) || null }));
  }
}
