import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserVerificationDto {
  @IsString()
  @IsNotEmpty()
  verifyToken: string;

  @IsDateString()
  @IsNotEmpty()
  expiredAt: Date;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
