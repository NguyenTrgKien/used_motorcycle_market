import { Module } from '@nestjs/common';
import { UserSessionService } from './user_session.service';
import { UserSessionController } from './user_session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from './entities/user_session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  controllers: [UserSessionController],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
