import { PartialType } from '@nestjs/mapped-types';
import { CreatePostImageDto } from './create-post_image.dto';

export class UpdatePostImageDto extends PartialType(CreatePostImageDto) {}
