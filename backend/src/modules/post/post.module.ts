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
import { Report } from '../report/entities/report.entity';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/entities/user.entity';
import { ListingPaymentModule } from '../listing_payment/listing-payment.module';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { POST_VIEW_REDIS } from './post.constants';

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
      Report,
      User,
    ]),
    CloudinaryModule,
    GeminiRateLimiterModule,
    NotificationModule,
    ListingPaymentModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    {
      provide: POST_VIEW_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis(
          config.get<string>('REDIS_URL') || 'redis://localhost:6379',
          {
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 500,
          },
        );

        redis.on('error', () => undefined);
        redis.connect().catch(() => undefined);

        return redis;
      },
    },
  ],
  exports: [PostService],
})
export class PostModule {}
