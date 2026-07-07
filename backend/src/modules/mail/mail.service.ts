import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendOtp(email: string, otp: string) {
    console.log('====================>', otp);
    const digits = otp.split('');
    const digitBoxes = digits
      .map(
        (d) => `
          <div style="
            width:44px;height:52px;background:#1a1a2e;border-radius:8px;
            display:inline-flex;align-items:center;justify-content:center;
            font-size:24px;font-weight:700;color:#ffffff;
            font-family:'Courier New',monospace;margin:0 4px;">
            ${d}
          </div>`,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>OTP Verification</title>
        </head>
        <body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#1a1a2e;padding:28px 40px;text-align:center;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">
                      ★ YourApp
                    </span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 24px;">
                    <p style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">Verify your account</p>
                    <p style="font-size:14px;color:#888888;margin:0 0 28px;line-height:1.6;">
                      We received a request to verify your email address.
                      Use the code below to complete verification.
                      Do not share this code with anyone.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1.5px solid #e0e4ff;border-radius:12px;margin-bottom:20px;">
                      <tr><td style="padding:24px;text-align:center;">
                        <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#aaaaaa;margin:0 0 12px;">
                          Your one-time password
                        </p>
                        <div style="margin-bottom:12px;">
                          ${digitBoxes}
                        </div>
                        <p style="font-size:12px;color:#e94560;margin:0;">
                          &#9201; Expires in 10 minutes
                        </p>
                      </td></tr>
                    </table>

                    <!-- Warning -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-left:3px solid #f0a04b;border-radius:0 8px 8px 0;margin-bottom:24px;">
                      <tr><td style="padding:12px 16px;">
                        <p style="font-size:13px;color:#7a5c2e;margin:0;line-height:1.5;">
                          ⚠️ If you didn't request this code, please ignore this email or contact support.
                        </p>
                      </td></tr>
                    </table>

                    <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"/>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;text-align:center;">
                    <p style="font-size:12px;color:#bbbbbb;margin:0;line-height:1.7;">
                      This is an automated message from YourApp.<br/>
                      © 2025 YourApp Inc. &nbsp;·&nbsp;
                      <a href="#" style="color:#1a1a2e;text-decoration:none;">Privacy Policy</a>
                      &nbsp;·&nbsp;
                      <a href="#" style="color:#1a1a2e;text-decoration:none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>`;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Your OTP Verification Code',
      html,
    });
  }

  async send2FaOtp(email: string, otp: string, action: 'enable' | 'disable') {
    const isEnable = action === 'enable';

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: isEnable
        ? '[Bảo mật] Mã OTP bật xác thực 2 lớp'
        : '[Bảo mật] Mã OTP tắt xác thực 2 lớp',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#111;">
          <h2 style="margin-bottom:8px;">Xác thực 2 lớp</h2>
          <p style="color:#555;margin-bottom:24px;">
            Yêu cầu <strong>${isEnable ? 'bật' : 'tắt'}</strong> xác thực 2 lớp cho tài khoản <strong>${email}</strong>.
          </p>
 
          <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:12px;color:#888;margin-bottom:8px;letter-spacing:0.08em;">MÃ XÁC THỰC</p>
            <span style="font-size:36px;font-weight:700;letter-spacing:0.2em;color:${isEnable ? '#059669' : '#dc2626'};">${otp}</span>
            <p style="font-size:12px;color:#888;margin-top:8px;">Hết hạn sau <strong>5 phút</strong></p>
          </div>
 
          <p style="font-size:13px;color:#888;">
            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
          </p>
        </div>
      `,
    });
  }

  async sendLoginOtp(email: string, otp: string) {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Mã OTP SignIn',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#111;">
          <h2 style="margin-bottom:8px;">Xác thực 2 lớp</h2>
          <p style="color:#555;margin-bottom:24px;">
            Đăng nhập
          </p>
 
          <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:12px;color:#888;margin-bottom:8px;letter-spacing:0.08em;">MÃ XÁC THỰC</p>
            <span style="font-size:36px;font-weight:700;letter-spacing:0.2em;color:'#059669'};">${otp}</span>
            <p style="font-size:12px;color:#888;margin-top:8px;">Hết hạn sau <strong>5 phút</strong></p>
          </div>
 
          <p style="font-size:13px;color:#888;">
            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
          </p>
        </div>
      `,
    });
  }
}
