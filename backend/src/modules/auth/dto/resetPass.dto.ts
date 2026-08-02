import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPassDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số!' })
  otp?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền mật khẩu!' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự!' })
  @MaxLength(72, { message: 'Mật khẩu không được vượt quá 72 ký tự!' })
  newPassword: string;
}
