import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPassDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền otp!' })
  otp: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền mật khẩu!' })
  newPassword: string;
}
