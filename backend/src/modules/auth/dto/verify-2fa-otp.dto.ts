import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { TwoFactorSendOtpDto } from './two-factor-send-otp.dto';

export class Verify2FaOtpDto extends TwoFactorSendOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được thiếu!' })
  @Matches(/^\d{6}$/, {
    message: 'Mã OTP phải gồm đúng 6 chữ số!',
  })
  otp!: string;
}
