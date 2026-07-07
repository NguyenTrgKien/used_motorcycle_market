import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { PostImage } from '../post_image/entities/post_image.entity';
import { Category } from '../category/entities/category.entity';
import { VehicleBrand } from '../vehicle/entities/vehicle_brand.entity';
import { VehicleModel } from '../vehicle/entities/vehicle_model.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { GeminiRateLimiterModule } from '../gemini-rate-limiter/gemini-rate-limiter.module';
import { Review } from '../review/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Vehicle,
      PostImage,
      Category,
      VehicleBrand,
      VehicleModel,
      Review,
    ]),
    CloudinaryModule,
    GeminiRateLimiterModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
