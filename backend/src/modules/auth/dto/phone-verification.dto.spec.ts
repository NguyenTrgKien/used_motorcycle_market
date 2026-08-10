import { validate } from 'class-validator';
import { VerifyPhoneVerificationDto } from './phone-verification.dto';

describe('VerifyPhoneVerificationDto', () => {
  it('accepts a six-digit OTP', async () => {
    const dto = Object.assign(new VerifyPhoneVerificationDto(), {
      otp: '123456',
      type: 'add_phone',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an OTP that is not exactly six digits', async () => {
    const dto = Object.assign(new VerifyPhoneVerificationDto(), {
      otp: '12345a',
      type: 'add_phone',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
