import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được thiếu!' })
  @Matches(/^\d{6}$/, {
    message: 'Mã OTP phải gồm đúng 6 chữ số!',
  })
  otp!: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email user không được thiếu!' })
  email!: string;
}
