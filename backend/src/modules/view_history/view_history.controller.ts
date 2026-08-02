import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';
import { RecordViewDto } from './dto/record-view.dto';
import { ViewHistoryService } from './view_history.service';

@Controller('view-history')
@Roles(UserRole.USER)
export class ViewHistoryController {
  constructor(private readonly viewHistoryService: ViewHistoryService) {}

  @Post()
  record(@Req() req: RequestWithUser, @Body() recordViewDto: RecordViewDto) {
    return this.viewHistoryService.record(req.user.id, recordViewDto.postId);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.viewHistoryService.findAll(req.user.id);
  }

  @Delete()
  clear(@Req() req: RequestWithUser) {
    return this.viewHistoryService.clear(req.user.id);
  }

  @Delete(':postId')
  remove(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.viewHistoryService.remove(req.user.id, postId);
  }
}
