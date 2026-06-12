import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserGender } from 'src/shared';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(UserGender, { message: 'Giới tính không hợp lệ!' })
  @IsOptional()
  gender?: UserGender;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @IsOptional()
  addressId?: number;

  @IsBoolean()
  @IsOptional()
  personalInfo?: string;
}
