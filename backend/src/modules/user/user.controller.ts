import {
  Controller,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPrivacyDto } from './dto/update-user-privacy.dto';
import { UpdateCreatePostGuideDto } from './dto/update-create-post-guide.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { type Request as ExpressRequest } from 'express';
import { type User } from './entities/user.entity';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';

interface RequestWithUser extends ExpressRequest {
  user: User;
}

@Controller(['users', 'user'])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get('/')
  getAllUsers(
    @Req() req: RequestWithUser,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.userService.getManagedUsers(req.user.id, query);
  }

  @Roles(UserRole.ADMIN)
  @Get('/admin/customers')
  getManagedUsers(
    @Req() req: RequestWithUser,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.userService.getManagedUsers(req.user.id, query);
  }

  @Roles(UserRole.ADMIN)
  @Get('/admin/staff')
  getStaffUsers(
    @Req() req: RequestWithUser,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.userService.getStaffUsers(req.user.id, query);
  }

  @Roles(UserRole.ADMIN)
  @Post('/admin/staff')
  createStaff(@Req() req: RequestWithUser, @Body() dataCreate: CreateStaffDto) {
    return this.userService.createStaff(req.user.id, dataCreate);
  }

  @Roles(UserRole.ADMIN)
  @Get('/admin/:id/detail')
  getManagedUserDetail(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.getManagedUserDetail(req.user.id, id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('/admin/:id/role')
  updateStaffRole(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dataUpdate: UpdateStaffRoleDto,
  ) {
    return this.userService.updateStaffRole(req.user.id, id, dataUpdate.role);
  }

  @Get('/:id')
  @Public()
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Patch('/avatar/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(req.user.id, id, avatar);
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
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dataUpdate: UpdateUserDto,
  ) {
    return this.userService.updateUserBasic(req.user.id, id, dataUpdate);
  }

  @Patch('/:id/ban')
  @Roles(UserRole.ADMIN)
  banUser(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.userService.banUser(req.user.id, id, reason);
  }

  @Patch('/:id/unban')
  @Roles(UserRole.ADMIN)
  unbanUser(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.userService.unbanUser(req.user.id, id);
  }
}
