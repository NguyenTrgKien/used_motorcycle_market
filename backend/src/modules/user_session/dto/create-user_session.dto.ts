import { IsOptional, IsString } from 'class-validator';

export class CreateUserSessionDto {
  @IsString()
  refreshToken: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  expiredAt: Date;
}
