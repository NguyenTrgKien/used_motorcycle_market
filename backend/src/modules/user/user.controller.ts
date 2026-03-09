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
  constructor(private readonly userService: UserService) {}

  @Get('/')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('/:id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dataUpdate: UpdateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.userService.updateUser(id, dataUpdate, avatar);
  }

  @Patch('/:id/ban')
  banUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.banUser(id);
  }
}
