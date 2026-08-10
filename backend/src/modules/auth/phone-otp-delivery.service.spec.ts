import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { PhoneOtpDeliveryService } from './phone-otp-delivery.service';

describe('PhoneOtpDeliveryService', () => {
  it('logs an OTP with the console provider', async () => {
    const config = {
      get: jest.fn().mockReturnValue('console'),
    } as unknown as ConfigService;
    const service = new PhoneOtpDeliveryService(config);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await service.send('+84521545654', '123456');

    expect(log).toHaveBeenCalledWith(
      '[PHONE_VERIFICATION_OTP] +84521545654: 123456',
    );
    log.mockRestore();
  });

  it('rejects an unavailable provider before creating an OTP', () => {
    const config = {
      get: jest.fn().mockReturnValue('sms'),
    } as unknown as ConfigService;
    const service = new PhoneOtpDeliveryService(config);
    expect(() => service.ensureAvailable()).toThrow(
      InternalServerErrorException,
    );
  });
});
