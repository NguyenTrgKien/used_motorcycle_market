import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng truyền mật khẩu!',
  })
  @MinLength(8, {
    message: 'Mật khẩu phải ít nhất 8 ký tự!',
  })
  password: string;
}
