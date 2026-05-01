import { PartialType } from '@nestjs/swagger';
import { CreateUserVerificationDto } from './create-user_verification.dto';

export class UpdateUserVerificationDto extends PartialType(CreateUserVerificationDto) {}
