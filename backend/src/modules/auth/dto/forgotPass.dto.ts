import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPassDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;
}
