import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyChangeContactOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền otp!' })
  otp!: string;
}
