import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostStatus } from 'src/shared';
import { Repository } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { CreateSavedPostDto } from './dto/create-saved_post.dto';
import { SavedPost } from './entities/saved_post.entity';

@Injectable()
export class SavedPostService {
  constructor(
    @InjectRepository(SavedPost)
    private readonly savedPostRepo: Repository<SavedPost>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async create(userId: number, createSavedPostDto: CreateSavedPostDto) {
    const post = await this.postRepo.findOne({
      where: { id: createSavedPostDto.postId },
    });

    if (!post || post.status === PostStatus.HIDDEN) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (post.userId === userId) {
      throw new BadRequestException('Bạn không thể lưu tin của chính mình');
    }

    const existing = await this.savedPostRepo.findOne({
      where: { userId, postId: post.id },
    });

    if (existing) {
      return {
        message: 'Tin đã có trong danh sách yêu thích',
        data: existing,
      };
    }

    const savedPost = this.savedPostRepo.create({
      userId,
      postId: post.id,
      savedAt: new Date(),
    });

    await this.savedPostRepo.save(savedPost);

    return {
      message: 'Đã thêm tin vào yêu thích',
      data: savedPost,
    };
  }

  async findAll(userId: number) {
    const savedPosts = await this.savedPostRepo.find({
      where: { userId },
      relations: {
        post: {
          vehicle: true,
          post_images: true,
          category: true,
        },
      },
      order: { savedAt: 'DESC' },
    });

    const items = savedPosts
      .filter((item) => item.post && item.post.status !== PostStatus.HIDDEN)
      .map((item) => ({
        id: item.id,
        savedAt: item.savedAt,
        post: item.post,
      }));

    return {
      message: 'Lấy danh sách tin yêu thích thành công',
      data: items,
    };
  }

  async getStatus(userId: number, postId: number) {
    const savedPost = await this.savedPostRepo.findOne({
      where: { userId, postId },
      select: { id: true },
    });

    return {
      message: 'Lấy trạng thái lưu tin thành công',
      data: {
        isSaved: Boolean(savedPost),
      },
    };
  }

  async remove(userId: number, postId: number) {
    const savedPost = await this.savedPostRepo.findOne({
      where: { userId, postId },
    });

    if (!savedPost) {
      throw new NotFoundException('Tin chưa có trong danh sách yêu thích');
    }

    await this.savedPostRepo.remove(savedPost);

    return {
      message: 'Đã bỏ tin khỏi yêu thích',
    };
  }
}
