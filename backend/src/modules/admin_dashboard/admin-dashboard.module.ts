import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingPaymentOrder } from '../listing_payment/entities/listing-payment-order.entity';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, ListingPaymentOrder])],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
