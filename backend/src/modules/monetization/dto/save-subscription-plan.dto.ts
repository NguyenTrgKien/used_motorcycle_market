import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SaveSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsInt()
  @Min(1)
  listingLimit: number;

  @IsInt()
  @Min(0)
  boostCredits: number;

  @IsOptional()
  @IsBoolean()
  recommended?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
