import { IsBoolean } from 'class-validator';

export class UpdateCreatePostGuideDto {
  @IsBoolean()
  hasSeenCreatePostGuide: boolean;
}
