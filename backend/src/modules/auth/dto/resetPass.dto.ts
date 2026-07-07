import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResetPassDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsOptional()
  otp?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền mật khẩu!' })
  newPassword: string;
}
