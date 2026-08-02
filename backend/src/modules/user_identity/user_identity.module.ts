import { Module } from '@nestjs/common';
import { UserIdentityService } from './user_identity.service';
import { UserIdentityController } from './user_identity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './entities/user_identity.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdentity, User]), CloudinaryModule],
  controllers: [UserIdentityController],
  providers: [UserIdentityService],
  exports: [UserIdentityService],
})
export class UserIdentityModule {}
