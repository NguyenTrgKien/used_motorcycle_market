import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerifyEmail(email: string, fullName: string, verifyToken: string) {
    try {
      const verificationLink = `http://localhost:3000/auth/verify?token=${verifyToken}`;
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác thực tài khoản',
        template: './verified.template.hbs',
        context: {
          fullName,
          verificationLink,
        },
      });
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }
}
