import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyChangeContactOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền otp!' })
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số!' })
  otp!: string;
}
