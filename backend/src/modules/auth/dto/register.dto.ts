import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền email!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền password!' })
  password: string;
}
