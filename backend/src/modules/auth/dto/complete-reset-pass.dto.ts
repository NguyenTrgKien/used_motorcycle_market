import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteResetPassDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền mật khẩu!' })
  newPassword: string;
}
