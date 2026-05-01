import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerifyEmail(email: string, verifyToken: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Xác thực tài khoản',
      template: './verified.template.hbs',
      context: {
        verifyToken,
      },
    });
  }
}
