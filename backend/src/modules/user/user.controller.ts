import {
  Controller,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('/')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('/:id')
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
