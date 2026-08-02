import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import type { RequestWithUser } from '../auth/auth.controller';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('start')
  start(
    @Req() req: RequestWithUser,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationService.start(req.user.id, createConversationDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.conversationService.findAll(req.user.id);
  }

  @Get(':id/messages')
  findMessages(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
  ) {
    return this.conversationService.findMessages(
      req.user.id,
      id,
      limit ? Number(limit) : undefined,
      beforeId ? Number(beforeId) : undefined,
    );
  }

  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  createMessage(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.conversationService.createMessage(
      req.user.id,
      id,
      createMessageDto,
      file,
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.conversationService.markRead(req.user.id, id);
  }
}
