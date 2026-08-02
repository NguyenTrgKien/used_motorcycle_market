import { IsInt, Min } from 'class-validator';

export class RecordViewDto {
  @IsInt()
  @Min(1)
  postId: number;
}
