import {
  Controller,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPrivacyDto } from './dto/update-user-privacy.dto';
import { UpdateCreatePostGuideDto } from './dto/update-create-post-guide.dto';
import { type Request as ExpressRequest } from 'express';
import { type User } from './entities/user.entity';
import { Public } from 'src/common/decorators/public.decorator';

interface RequestWithUser extends ExpressRequest {
  user: User;
}

@Controller(['users', 'user'])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('/:id')
  @Public()
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Patch('/avatar/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(id, avatar);
  }

  @Patch('/privacy')
  updatePrivacy(
    @Req() req: RequestWithUser,
    @Body() dataUpdate: UpdateUserPrivacyDto,
  ) {
    return this.userService.updatePrivacy(req.user.id, dataUpdate);
  }

  @Patch('/create-post-guide')
  updateCreatePostGuide(
    @Req() req: RequestWithUser,
    @Body() dataUpdate: UpdateCreatePostGuideDto,
  ) {
    return this.userService.updateCreatePostGuide(req.user.id, dataUpdate);
  }

  @Patch('/:id')
  updateUserBasic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dataUpdate: UpdateUserDto,
  ) {
    return this.userService.updateUserBasic(id, dataUpdate);
  }

  @Patch('/:id/ban')
  banUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.banUser(id);
  }
}
