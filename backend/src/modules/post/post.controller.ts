import {
  Body,
  Controller,
  Delete,
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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SuggestVehiclePriceDto } from './dto/suggest-vehicle-price.dto';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Roles(UserRole.USER)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 12 },
      { name: 'documentImages', maxCount: 4 },
    ]),
  )
  create(
    @Req() req: RequestWithUser,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      documentImages?: Express.Multer.File[];
    },
  ) {
    return this.postService.create(
      req.user.id,
      createPostDto,
      files?.images || [],
      files?.documentImages || [],
    );
  }

  @Roles(UserRole.USER)
  @Post('analyze-images/attributes')
  @UseInterceptors(FilesInterceptor('images', 8))
  analyzeImages(@UploadedFiles() images: Express.Multer.File[]) {
    return this.postService.analyzeImages(images || []);
  }

  @Roles(UserRole.USER)
  @Post('analyze-images/description')
  @UseInterceptors(FilesInterceptor('images', 8))
  generateImageDescription(@UploadedFiles() images: Express.Multer.File[]) {
    return this.postService.generateImageDescription(images || []);
  }

  @Roles(UserRole.USER)
  @Post('suggest-price')
  suggestPrice(@Body() suggestVehiclePriceDto: SuggestVehiclePriceDto) {
    return this.postService.suggestPrice(suggestVehiclePriceDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.postService.findAll(query);
  }

  @Roles(UserRole.USER)
  @Get('my')
  findMine(@Req() req: RequestWithUser) {
    return this.postService.findMine(req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  findForAdmin(@Query() query: Record<string, string | undefined>) {
    return this.postService.findForAdmin(query);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('admin/pending')
  findPendingForAdmin(@Query() query: Record<string, string | undefined>) {
    return this.postService.findPendingForAdmin(query);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('admin/review/:slug')
  findReviewForAdmin(@Param('slug') slug: string) {
    return this.postService.findReviewForAdmin(slug);
  }

  @Public()
  @Get(':slug/similar')
  findSimilar(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.findSimilar(slug, Number(limit || 4));
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Patch('admin/:id/approve')
  approvePost(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.approvePost(req.user.id, id);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Patch('admin/:id/reject')
  rejectPost(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.postService.rejectPost(id, reason);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/restore')
  restoreForAdmin(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postService.restoreForAdmin(req.user.id, id);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/:id')
  removeForAdmin(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.postService.removeForAdmin(req.user.id, id, reason);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postService.findOne(slug);
  }

  @Roles(UserRole.USER)
  @Patch(':postId/images/:imageId/primary')
  setPrimaryImage(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.postService.setPrimaryImage(req.user.id, postId, imageId);
  }

  @Roles(UserRole.USER)
  @Delete(':postId/images/:imageId')
  removeImage(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.postService.removeImage(req.user.id, postId, imageId);
  }

  @Roles(UserRole.USER)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 12 },
      { name: 'documentImages', maxCount: 4 },
    ]),
  )
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      documentImages?: Express.Multer.File[];
    },
  ) {
    return this.postService.update(
      req.user.id,
      id,
      updatePostDto,
      files?.images || [],
      files?.documentImages || [],
    );
  }

  @Roles(UserRole.USER)
  @Patch(':id/sold')
  markSold(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.markSold(req.user.id, id);
  }

  @Roles(UserRole.USER)
  @Patch(':id/relist')
  relist(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.relist(req.user.id, id);
  }

  @Roles(UserRole.USER)
  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(req.user.id, id);
  }
}
