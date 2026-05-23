import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyChangeEmailOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền otp!' })
  otp: string;
}
