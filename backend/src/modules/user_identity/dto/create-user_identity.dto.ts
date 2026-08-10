import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  Equals,
} from 'class-validator';
import { IdType, UserGender } from 'src/shared';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserIdentityDto {
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @Equals(true, { message: 'Bạn phải xác nhận chỉ sử dụng dữ liệu mô phỏng' })
  demoConsent: boolean;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  idNumber: string;

  @IsEnum(IdType)
  idType: IdType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(UserGender)
  gender: UserGender;

  @IsDateString()
  issueDate: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issuePlace: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;
}
