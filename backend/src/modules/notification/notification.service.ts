import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from 'src/shared';
import { NotificationGateway } from './notification.gateway';

interface CreateNotificationPayload {
  userId: number;
  title: string;
  content: string;
  type: NotificationType;
  referenceId: number;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(data: CreateNotificationPayload) {
    const notification = this.notificationRepository.create(data);
    const savedNotification =
      await this.notificationRepository.save(notification);
    this.notificationGateway.emitNotificationCreated(savedNotification);

    return savedNotification;
  }

  async findMine(userId: number) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.notificationRepository.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      message: 'Lay danh sach thong bao thanh cong',
      data: notifications,
      unreadCount,
    };
  }

  async markRead(userId: number, id: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Khong tim thay thong bao');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }

    return {
      message: 'Da danh dau thong bao da doc',
      data: notification,
    };
  }

  async markAllRead(userId: number) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    return {
      message: 'Da danh dau tat ca thong bao da doc',
    };
  }
}
