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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { ReviewUserIdentityDto } from './dto/review-user-identity.dto';
import { UserIdentityService } from './user_identity.service';

@Controller('user-identity')
export class UserIdentityController {
  constructor(private readonly service: UserIdentityService) {}

  @Roles(UserRole.USER)
  @Get('me')
  getMine(@Req() req: RequestWithUser) {
    return this.service.getMine(req.user.id);
  }

  @Roles(UserRole.USER)
  @Post('application')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  submit(
    @Req() req: RequestWithUser,
    @Body() data: CreateUserIdentityDto,
    @UploadedFiles()
    files: {
      idFront?: Express.Multer.File[];
      idBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.service.submit(req.user.id, data, files || {});
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/applications')
  getApplications(@Query() query: Record<string, string | undefined>) {
    return this.service.getApplications(query);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/processing')
  markProcessing(@Param('id', ParseIntPipe) id: number) {
    return this.service.markProcessing(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.service.approve(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReviewUserIdentityDto,
  ) {
    return this.service.reject(id, data.reason);
  }
}
