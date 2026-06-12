import { IsEnum, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { UserTwoFactorMethod } from 'src/shared';

export class TwoFactorSendOtpDto {
  @IsIn(['enable', 'disable'])
  @IsNotEmpty({ message: 'Vui lòng truyền hành động!' })
  action!: 'enable' | 'disable';

  @IsEnum(UserTwoFactorMethod, {
    message: 'Phương thức xác thực 2fa không hợp lệ!',
  })
  @IsOptional()
  method?: UserTwoFactorMethod;
}
