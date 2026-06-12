import { Module } from '@nestjs/common';
import { UserSessionService } from './user_session.service';
import { UserSessionController } from './user_session.controller';

@Module({
  controllers: [UserSessionController],
  providers: [UserSessionService],
})
export class UserSessionModule {}
