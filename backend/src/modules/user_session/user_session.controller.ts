import { Controller, Delete, Get, Param, Req } from '@nestjs/common';
import { UserSessionService } from './user_session.service';
import { type Request as ExpressRequest } from 'express';
import { type User } from '../user/entities/user.entity';

interface SessionRequest extends ExpressRequest {
  user: User;
}

@Controller('user-session')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}

  @Get()
  async findUserSessions(@Req() req: SessionRequest) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const sessions = await this.userSessionService.findUserSessions(
      req.user.id,
      cookies?.refresh_token,
    );
    return {
      message: 'Lay danh sach phien dang nhap thanh cong',
      data: sessions,
    };
  }

  @Delete('others')
  revokeOtherSessions(@Req() req: SessionRequest) {
    const cookies = req.cookies as Record<string, string> | undefined;
    return this.userSessionService.revokeOtherSessions(
      req.user.id,
      cookies?.refresh_token,
    );
  }

  @Delete(':id')
  revoke(@Req() req: SessionRequest, @Param('id') id: string) {
    return this.userSessionService.revoke(req.user.id, Number(id));
  }
}
