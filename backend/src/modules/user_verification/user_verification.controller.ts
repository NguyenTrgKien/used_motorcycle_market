import { Controller, Body } from '@nestjs/common';
import { UserVerificationService } from './user_verification.service';

@Controller('user-verification')
export class UserVerificationController {
  constructor(
    private readonly userVerificationService: UserVerificationService,
  ) {}
}
