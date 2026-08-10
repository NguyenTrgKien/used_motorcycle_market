import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';
import { PricingPlan } from './entities/pricing-plan.entity';
import { PostBoost } from './entities/post-boost.entity';
import { SellerSubscriptionPlan } from './entities/seller-subscription-plan.entity';
import { SellerSubscription } from './entities/seller-subscription.entity';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { MonetizationAuditLog } from './entities/monetization-audit-log.entity';
import { BoostCampaign } from './entities/boost-campaign.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([PricingPlan, PostBoost, BoostCampaign, SellerSubscriptionPlan, SellerSubscription, MonetizationAuditLog, Post, User]), NotificationModule],
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService, TypeOrmModule],
})
export class MonetizationModule {}
