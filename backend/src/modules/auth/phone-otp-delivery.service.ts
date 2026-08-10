import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PhoneOtpDeliveryService {
  constructor(private readonly configService: ConfigService) {}

  ensureAvailable() {
    const provider = this.configService.get<string>(
      'PHONE_OTP_PROVIDER',
      'console',
    );
    if (provider !== 'console') {
      throw new InternalServerErrorException('Dịch vụ SMS chưa được cấu hình!');
    }
  }

  send(phone: string, otp: string): Promise<void> {
    this.ensureAvailable();
    console.log(`[PHONE_VERIFICATION_OTP] ${phone}: ${otp}`);
    return Promise.resolve();
  }
}
