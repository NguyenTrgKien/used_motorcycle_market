import { Module } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';
import { UserVerificationController } from './user_verification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVerification } from './entities/user_verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserVerification])],
  controllers: [UserVerificationController],
  providers: [UserVerificationService],
  exports: [UserVerificationService],
})
export class UserVerificationModule {}
