import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingPaymentController } from './listing-payment.controller';
import { ListingPaymentService } from './listing-payment.service';
import { ListingFreeQuota } from './entities/listing-free-quota.entity';
import { ListingPaymentOrder } from './entities/listing-payment-order.entity';
import { Post } from '../post/entities/post.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { ProfessionalSellerProfile } from '../professional_seller/entities/professional_seller_profile.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingFreeQuota,
      ListingPaymentOrder,
      Post,
      Category,
      User,
      ProfessionalSellerProfile,
    ]),
    NotificationModule,
    CloudinaryModule,
    MonetizationModule,
  ],
  controllers: [ListingPaymentController],
  providers: [ListingPaymentService],
  exports: [ListingPaymentService, TypeOrmModule],
})
export class ListingPaymentModule {}
