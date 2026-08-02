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
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';
import { CreateProfessionalSellerDto } from './dto/create-professional-seller.dto';
import { ReviewProfessionalSellerDto } from './dto/review-professional-seller.dto';
import { UpdateProfessionalSellerDto } from './dto/update-professional-seller.dto';
import { ProfessionalSellerService } from './professional_seller.service';

@Controller('professional-sellers')
export class ProfessionalSellerController {
  constructor(private readonly service: ProfessionalSellerService) {}

  @Roles(UserRole.USER)
  @Post('application')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'businessLicense', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  submit(
    @Req() req: RequestWithUser,
    @Body() data: CreateProfessionalSellerDto,
    @UploadedFiles()
    files: {
      businessLicense?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    return this.service.submit(req.user.id, data, files || {});
  }

  @Roles(UserRole.USER)
  @Get('me')
  getMine(@Req() req: RequestWithUser) {
    return this.service.getMine(req.user.id);
  }

  @Roles(UserRole.USER)
  @Patch('me')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  updateMine(
    @Req() req: RequestWithUser,
    @Body() data: UpdateProfessionalSellerDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    return this.service.updateMine(req.user.id, data, files || {});
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/applications')
  getApplications(@Query() query: Record<string, string | undefined>) {
    return this.service.getApplications(query);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/approve')
  approve(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.approve(req.user.id, id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/reject')
  reject(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReviewProfessionalSellerDto,
  ) {
    return this.service.reject(req.user.id, id, data.reason);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/suspend')
  suspend(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReviewProfessionalSellerDto,
  ) {
    return this.service.suspend(req.user.id, id, data.reason);
  }

  @Public()
  @Get(':id/posts')
  getPublicPosts(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPublicPosts(id);
  }

  @Public()
  @Get(':id')
  getPublic(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPublic(id);
  }
}
