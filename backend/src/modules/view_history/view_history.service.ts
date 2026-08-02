import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostStatus } from 'src/shared';
import { Repository } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { ViewHistory } from './entities/view_history.entity';

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepo: Repository<ViewHistory>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async record(userId: number, postId: number) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      select: { id: true, userId: true, status: true },
    });

    if (!post || post.status === PostStatus.HIDDEN) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (post.userId === userId) {
      return {
        message: 'Không ghi nhận lịch sử cho tin của chính bạn',
        data: null,
      };
    }

    await this.viewHistoryRepo.upsert(
      {
        userId,
        postId,
        viewedAt: new Date(),
      },
      {
        conflictPaths: ['userId', 'postId'],
        skipUpdateIfNoValuesChanged: false,
      },
    );

    return {
      message: 'Đã ghi nhận lịch sử xem tin',
    };
  }

  async findAll(userId: number) {
    const histories = await this.viewHistoryRepo.find({
      where: { userId },
      relations: {
        post: {
          vehicle: true,
          post_images: true,
          category: true,
        },
      },
      order: { viewedAt: 'DESC' },
    });

    const items = histories
      .filter((item) => item.post && item.post.status !== PostStatus.HIDDEN)
      .map((item) => ({
        id: item.id,
        viewedAt: item.viewedAt,
        post: item.post,
      }));

    return {
      message: 'Lấy lịch sử xem tin thành công',
      data: items,
    };
  }

  async remove(userId: number, postId: number) {
    const result = await this.viewHistoryRepo.delete({ userId, postId });

    if (!result.affected) {
      throw new NotFoundException('Tin không có trong lịch sử xem');
    }

    return {
      message: 'Đã xóa tin khỏi lịch sử xem',
    };
  }

  async clear(userId: number) {
    await this.viewHistoryRepo.delete({ userId });

    return {
      message: 'Đã xóa toàn bộ lịch sử xem tin',
    };
  }
}
