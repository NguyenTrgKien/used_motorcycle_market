import { IsInt, Min } from 'class-validator';

export class CreateSavedPostDto {
  @IsInt()
  @Min(1)
  postId: number;
}
