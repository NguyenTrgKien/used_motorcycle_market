import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export const phoneVerificationTypes = ['add_phone', 'change_phone'] as const;

export type PhoneVerificationType = (typeof phoneVerificationTypes)[number];

export class RequestPhoneVerificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại!' })
  phone!: string;

  @IsIn(phoneVerificationTypes, {
    message: 'Loại xác minh số điện thoại không hợp lệ!',
  })
  type!: PhoneVerificationType;

  @IsOptional()
  @IsString()
  password?: string;
}

export class VerifyPhoneVerificationDto {
  @Matches(/^\d{6}$/, { message: 'OTP phải gồm đúng 6 chữ số!' })
  otp!: string;

  @IsIn(phoneVerificationTypes, {
    message: 'Loại xác minh số điện thoại không hợp lệ!',
  })
  type!: PhoneVerificationType;
}

export class ResendPhoneVerificationDto {
  @IsIn(phoneVerificationTypes, {
    message: 'Loại xác minh số điện thoại không hợp lệ!',
  })
  type!: PhoneVerificationType;
}
