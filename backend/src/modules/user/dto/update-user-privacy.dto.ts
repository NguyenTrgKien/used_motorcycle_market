import { IsBoolean } from 'class-validator';

export class UpdateUserPrivacyDto {
  @IsBoolean()
  showEmail: boolean;

  @IsBoolean()
  showPhone: boolean;
}
