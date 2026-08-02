import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { SavedPostService } from './saved_post.service';
import { CreateSavedPostDto } from './dto/create-saved_post.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';

@Controller('saved-post')
@Roles(UserRole.USER)
export class SavedPostController {
  constructor(private readonly savedPostService: SavedPostService) {}

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createSavedPostDto: CreateSavedPostDto,
  ) {
    return this.savedPostService.create(req.user.id, createSavedPostDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.savedPostService.findAll(req.user.id);
  }

  @Get('status/:postId')
  getStatus(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.savedPostService.getStatus(req.user.id, postId);
  }

  @Delete(':postId')
  remove(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.savedPostService.remove(req.user.id, postId);
  }
}
