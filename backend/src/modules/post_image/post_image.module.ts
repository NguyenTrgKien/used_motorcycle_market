import { Module } from '@nestjs/common';
import { PostImageService } from './post_image.service';
import { PostImageController } from './post_image.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostImage } from './entities/post_image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostImage])],
  controllers: [PostImageController],
  providers: [PostImageService],
  exports: [PostImageService],
})
export class PostImageModule {}
