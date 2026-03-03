import { Injectable } from '@nestjs/common';
import { CreatePostImageDto } from './dto/create-post_image.dto';
import { UpdatePostImageDto } from './dto/update-post_image.dto';

@Injectable()
export class PostImageService {
  create(createPostImageDto: CreatePostImageDto) {
    return 'This action adds a new postImage';
  }

  findAll() {
    return `This action returns all postImage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postImage`;
  }

  update(id: number, updatePostImageDto: UpdatePostImageDto) {
    return `This action updates a #${id} postImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} postImage`;
  }
}
