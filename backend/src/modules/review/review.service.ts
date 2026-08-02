import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { Post } from '../post/entities/post.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/shared';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(reviewerId: number, createReviewDto: CreateReviewDto) {
    if (reviewerId === createReviewDto.revieweeId) {
      throw new BadRequestException('Khong the tu danh gia chinh minh');
    }

    const post = await this.postRepo.findOne({
      where: { id: createReviewDto.postId },
    });

    if (!post) {
      throw new NotFoundException('Khong tim thay tin dang');
    }

    if (post.userId !== createReviewDto.revieweeId) {
      throw new BadRequestException('Nguoi duoc danh gia khong khop tin dang');
    }

    const existingReview = await this.reviewRepo.findOne({
      where: {
        reviewerId,
        revieweeId: createReviewDto.revieweeId,
        postId: createReviewDto.postId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Ban da danh gia nguoi dung nay cho tin dang nay');
    }

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        reviewerId,
        revieweeId: createReviewDto.revieweeId,
        postId: createReviewDto.postId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment?.trim() || undefined,
      }),
    );

    await this.notificationService.createNotification({
      userId: createReviewDto.revieweeId,
      title: 'Bạn có đánh giá mới',
      content: `Bạn vừa nhận đánh giá ${createReviewDto.rating} sao cho tin "${post.title}".`,
      type: NotificationType.NEW_REVIEW,
      referenceId: review.id,
    });

    return {
      message: 'Tao danh gia thanh cong',
      data: review,
    };
  }

  async findAll() {
    const reviews = await this.reviewRepo.find({
      relations: { reviewer: true, reviewee: true, post: true },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Lay danh sach danh gia thanh cong',
      data: reviews,
    };
  }

  async findOne(id: number) {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: { reviewer: true, reviewee: true, post: true },
    });

    if (!review) {
      throw new NotFoundException('Khong tim thay danh gia');
    }

    return {
      message: 'Lay chi tiet danh gia thanh cong',
      data: review,
    };
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Khong tim thay danh gia');
    }

    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }

    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment?.trim() || undefined;
    }

    await this.reviewRepo.save(review);

    return {
      message: 'Cap nhat danh gia thanh cong',
      data: review,
    };
  }

  async remove(id: number) {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Khong tim thay danh gia');
    }

    await this.reviewRepo.delete(id);

    return {
      message: 'Xoa danh gia thanh cong',
    };
  }
}
