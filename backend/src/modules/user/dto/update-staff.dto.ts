import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
