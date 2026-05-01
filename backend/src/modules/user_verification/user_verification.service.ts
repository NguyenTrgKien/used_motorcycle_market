import { Injectable } from '@nestjs/common';
import { CreateUserVerificationDto } from './dto/create-user_verification.dto';

@Injectable()
export class UserVerificationService {
  create(createUserVerificationDto: CreateUserVerificationDto) {
    return 'This action adds a new userVerification';
  }
}
