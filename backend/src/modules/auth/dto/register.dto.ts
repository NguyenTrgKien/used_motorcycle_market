import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  @MaxLength(254, { message: 'Email không được vượt quá 254 ký tự!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền password!' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự!' })
  @MaxLength(72, { message: 'Mật khẩu không được vượt quá 72 ký tự!' })
  password: string;
}
