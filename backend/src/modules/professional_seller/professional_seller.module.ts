import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { ProfessionalSellerProfile } from './entities/professional_seller_profile.entity';
import { ProfessionalSellerController } from './professional_seller.controller';
import { ProfessionalSellerService } from './professional_seller.service';
import { AddressModule } from '../address/address.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfessionalSellerProfile, User, Post]),
    CloudinaryModule,
    AddressModule,
    NotificationModule,
  ],
  controllers: [ProfessionalSellerController],
  providers: [ProfessionalSellerService],
  exports: [ProfessionalSellerService],
})
export class ProfessionalSellerModule {}
