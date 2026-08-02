import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền otp!' })
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số!' })
  otp: string;
}
