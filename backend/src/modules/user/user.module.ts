import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserVerificationModule } from '../user_verification/user_verification.module';
import { UserAddressModule } from '../user_address/user_address.module';
import { Post } from '../post/entities/post.entity';
import { Report } from '../report/entities/report.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Report, UserAddress]),
    MailModule,
    CloudinaryModule,
    UserVerificationModule,
    forwardRef(() => UserAddressModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
