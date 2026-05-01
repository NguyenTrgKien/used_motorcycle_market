import { Module } from '@nestjs/common';
import { UserIdentityService } from './user_identity.service';
import { UserIdentityController } from './user_identity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './entities/user_identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdentity])],
  controllers: [UserIdentityController],
  providers: [UserIdentityService],
  exports: [UserIdentityService],
})
export class UserIdentityModule {}
