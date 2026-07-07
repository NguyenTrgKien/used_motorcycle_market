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
import type { RequestWithUser } from '../auth/auth.controller';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

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

  @Post('analyze-images')
  @UseInterceptors(FilesInterceptor('images', 8))
  analyzeImages(@UploadedFiles() images: Express.Multer.File[]) {
    return this.postService.analyzeImages(images || []);
  }

  @Post('suggest-price')
  suggestPrice(@Body() suggestVehiclePriceDto: SuggestVehiclePriceDto) {
    return this.postService.suggestPrice(suggestVehiclePriceDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.postService.findAll(query);
  }

  @Get('my')
  findMine(@Req() req: RequestWithUser) {
    return this.postService.findMine(req.user.id);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postService.findOne(slug);
  }

  @Patch(':postId/images/:imageId/primary')
  setPrimaryImage(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.postService.setPrimaryImage(req.user.id, postId, imageId);
  }

  @Delete(':postId/images/:imageId')
  removeImage(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.postService.removeImage(req.user.id, postId, imageId);
  }

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

  @Patch(':id/sold')
  markSold(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.markSold(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(req.user.id, id);
  }
}
