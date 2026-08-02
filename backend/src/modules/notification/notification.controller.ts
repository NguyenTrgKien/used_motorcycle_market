import { Controller, Get, Param, ParseIntPipe, Patch, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { RequestWithUser } from '../auth/auth.controller';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findMine(@Req() req: RequestWithUser) {
    return this.notificationService.findMine(req.user.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markRead(req.user.id, id);
  }
}
