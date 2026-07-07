import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { comparePass, hashPass } from 'src/utils/handlePassword';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BlacklistToken } from '../blacklist_token/entities/blacklist_token.entity';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { UserTwoFactorMethod, VerificationType } from 'src/shared';
import { MailService } from '../mail/mail.service';
import { ForgotPassDto } from './dto/forgotPass.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { GoogleUser } from './strategys/google.strategy';
import { AddPasswordDto, ChangePassDto } from './dto/changePass.dto';
import { ChangeContactDto } from './dto/changeContact.dto';
import { VerifyChangeContactOtpDto } from './dto/verifyChangeContact.dto';
import { randomInt } from 'crypto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { TwoFactorSendOtpDto } from './dto/two-factor-send-otp.dto';
import { Verify2FaOtpDto } from './dto/verify-2fa-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { UserSessionService } from '../user_session/user_session.service';

interface JwtPayload {
  exp: number;
  sub: number;
  email: string;
  role: string;
  sessionId?: number;
}

export interface LoginDeviceInfo {
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(BlacklistToken)
    private readonly blacklistTokenRepo: Repository<BlacklistToken>,
    @InjectRepository(UserVerification)
    private readonly userVerifyRepo: Repository<UserVerification>,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly userSessionService: UserSessionService,
  ) {}

  private async createVerificationOtp(
    userId: number,
    type: VerificationType,
    metadata?: Record<string, any>,
  ) {
    const token = randomInt(100000, 900000).toString();
    const expiredAt = new Date(Date.now() + 1000 * 60 * 5);

    await this.userVerifyRepo.delete({
      user: { id: userId },
      type,
    });

    await this.userVerifyRepo.save({
      token,
      expiredAt,
      type,
      user: { id: userId },
      metadata,
    });

    return {
      token,
      expiredAt,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);

    if (user && user.password) {
      const compareP = await comparePass(password, user.password);
      if (compareP) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async checkTwoFactorEnabled(userId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return {
      two_factor_enabled: rest.two_factor_enabled,
      user: rest,
    };
  }

  async sendOtpLogin(user: User) {
    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      VerificationType.LOGIN,
    );
    await this.mailService.sendLoginOtp(user.email, token);
    return {
      expiredAt,
      message: 'Mã otp đã được gửi về!',
      two_factor_enabled: true,
      type: VerificationType.LOGIN,
    };
  }

  async verifyLoginOtp(body: VerifyLoginOtpDto) {
    const user = await this.userService.findUserByEmail(body.email);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const verification = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        type: VerificationType.LOGIN,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!verification) {
      throw new BadRequestException('Không tìm thấy mã OTP');
    }

    if (verification.token !== body.otp) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    if (verification.expiredAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }

    await this.userVerifyRepo.delete({
      id: verification.id,
    });

    return user;
  }

  async login(user: User, deviceInfo?: LoginDeviceInfo) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshTokenPayload =
      this.jwtService.decode<JwtPayload>(refresh_token);
    const expiredAt =
      refreshTokenPayload && typeof refreshTokenPayload.exp === 'number'
        ? new Date(refreshTokenPayload.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await this.userSessionService.create(user.id, {
      refreshToken: refresh_token,
      expiredAt,
      ...deviceInfo,
    });
    const access_token = this.jwtService.sign(
      {
        ...payload,
        sessionId: session.id,
      },
      { expiresIn: '7d' },
    );

    return {
      status: true,
      message: 'Đăng nhập thành công',
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }

  async register(dataRegister: RegisterDto) {
    return this.userService.register(dataRegister);
  }

  async refreshAccessToken(refreshToken: string) {
    const session = await this.userSessionService.refresh(refreshToken);
    const user = session.user;
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      },
      { expiresIn: '7d' },
    );

    return {
      access_token,
    };
  }

  async verifyPassword(body: VerifyPasswordDto, userId: number) {
    const { password } = body;
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy user!');
    }

    if (!user.password) {
      throw new BadRequestException('Tài khoản chưa thiết lập mật khẩu!');
    }

    const isPasswordValid = await comparePass(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không chính xác!');
    }

    return {
      message: 'Mật khẩu hợp lệ!',
    };
  }

  async getMe(userId: number) {
    return await this.userService.getMe(userId);
  }

  async getDataSecuritySetting(userId: number) {
    return await this.userService.getDataSecuritySetting(userId);
  }

  async deleteAccount(userId: number, accessToken?: string | null) {
    await this.userService.deleteAccount(userId);

    if (accessToken) {
      await this.addToBlacklist(accessToken);
    }

    return {
      message: 'Xoa tai khoan thanh cong!',
    };
  }

  // Register verify email
  async verifyEmail(data: VerifyEmailDto) {
    const user = await this.userService.findUserByEmail(data.email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác thực trước đó!');
    }

    const record = await this.userVerifyRepo.findOne({
      where: {
        token: data.otp,
        type: VerificationType.REGISTER_EMAIL,
        user: {
          id: user.id,
        },
        expiredAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new BadRequestException('Mã OTP không hợp lệ!');
    }

    if (new Date() > record.expiredAt) {
      await this.userVerifyRepo.delete(record.id);
      throw new BadRequestException(
        'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới!',
      );
    }

    await this.userService.updateVerify(user.id, true);
    await this.userVerifyRepo.delete(record.id);
    const userUpdated = await this.userService.findUserById(user.id);
    return userUpdated as User;
  }

  // Resend verification otp with userId and type
  async resendVerificationOtp(user: User) {
    const email = user.email;
    const existUser = await this.userService.findUserById(user.id);
    if (!existUser) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    if (existUser.isVerified) {
      throw new BadRequestException('Tài khoản đã xác thực!');
    }

    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      VerificationType.REGISTER_EMAIL,
    );

    try {
      await this.mailService.sendOtp(email, token);
    } catch (error) {
      console.log('Send mail failed =============>', error);
      throw new InternalServerErrorException('Gửi email thất bại!');
    }
    return {
      message: 'OTP mới đã được gửi về email!',
      expiresAt: expiredAt,
    };
  }

  // Forgot password and send otp
  async forgotPassword(data: ForgotPassDto) {
    const { email } = data;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }

    if (user.googleId && !user.password) {
      throw new BadRequestException('Tài khoản đăng nhập bằng google!');
    }

    const { token } = await this.createVerificationOtp(
      user.id,
      VerificationType.RESET_PASSWORD,
    );

    try {
      await this.mailService.sendOtp(email, token);
    } catch (error) {
      console.log('Send mail failed===============>', error);
      throw new InternalServerErrorException('Gửi email thất bại!');
    }
    return { message: 'OTP đã được gửi về email!' };
  }

  // Verify forgot password otp
  async verifyForgotPassOtp(data: VerifyEmailDto) {
    const { email, otp } = data;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    const isValid = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        token: otp,
        type: VerificationType.RESET_PASSWORD,
        expiredAt: MoreThan(new Date()),
      },
    });

    if (isValid) {
      await this.userVerifyRepo.update(isValid.id, {
        verifiedAt: new Date(),
      });
    }

    if (!isValid)
      throw new BadRequestException('OTP không đúng hoặc đã hết hạn!');
    return { message: 'Xác thực thành công!' };
  }

  // reset password after verify forgot password otp
  async resetPassword(data: ResetPassDto) {
    const { email, otp, newPassword } = data;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    const verification = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        type: VerificationType.RESET_PASSWORD,
        expiredAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });
    const isValid = verification;
    if (!isValid) throw new BadRequestException('Phiên xác thực hết hạn!');
    if (otp) {
      if (isValid.token !== otp) {
        throw new BadRequestException('OTP khong hop le hoac da het han!');
      }
    } else if (!isValid.verifiedAt) {
      throw new BadRequestException('Vui long xac thuc OTP truoc!');
    }

    await this.userVerifyRepo.delete(isValid.id);
    const hashed = await hashPass(newPassword);
    await this.userService.updatePassword(email, hashed);
    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  isEmail(contact: string) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(contact);
  }

  // Validate email / phone and send otp to new email / phone
  async requestChangeContact(userId: number, data: ChangeContactDto) {
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    const { contact } = data;
    const isEmail = this.isEmail(contact);

    const latestOtp = await this.userVerifyRepo.findOne({
      where: {
        user: { id: user.id },
        type: isEmail
          ? VerificationType.CHANGE_EMAIL
          : VerificationType.CHANGE_PHONE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < 60_000) {
      throw new BadRequestException('Vui lòng chờ trước khi yêu cầu OTP mới!');
    }

    if (isEmail) {
      if (user.email === contact) {
        throw new BadRequestException(
          'Email mới không được trùng với email hiện tại!',
        );
      }

      const existingUser = await this.userService.findUserByEmail(contact);

      if (existingUser) {
        throw new BadRequestException('Email đã được đăng ký!');
      }

      await this.userVerifyRepo.delete({
        user: { id: user.id },
        type: VerificationType.CHANGE_EMAIL,
      });

      const { token } = await this.createVerificationOtp(
        user.id,
        VerificationType.CHANGE_EMAIL,
        {
          newEmail: contact,
        },
      );

      try {
        await this.mailService.sendOtp(contact, token);
      } catch (error) {
        console.error(error);

        throw new InternalServerErrorException('Gửi email thất bại!');
      }

      return {
        message: 'OTP đã gửi tới email mới!',
      };
    }

    if (user.phone === contact) {
      throw new BadRequestException(
        'Số điện thoại mới không được trùng với số điện thoại hiện tại!',
      );
    }

    const existingUser = await this.userService.findUserByPhone(contact);

    if (existingUser) {
      throw new BadRequestException('Số điện thoại đã được đăng ký!');
    }

    await this.userVerifyRepo.delete({
      user: { id: user.id },
      type: VerificationType.CHANGE_PHONE,
    });

    const { token } = await this.createVerificationOtp(
      user.id,
      VerificationType.CHANGE_PHONE,
      {
        newPhone: contact,
      },
    );

    console.log('=============>', token);
    return {
      message: 'OTP đã gửi tới số điện thoại!',
    };
  }

  // Verify otp new email
  async verifyChangeContactOtp(user: User, data: VerifyChangeContactOtpDto) {
    const { otp } = data;

    const record = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        token: otp,
        expiredAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new BadRequestException('OTP không đúng hoặc đã hết hạn!');
    }

    switch (record.type) {
      case VerificationType.CHANGE_EMAIL: {
        const newEmail = record.metadata?.newEmail;

        if (typeof newEmail !== 'string') {
          throw new BadRequestException('Thiếu email mới trong OTP!');
        }

        const existingUser = await this.userService.findUserByEmail(newEmail);

        if (existingUser) {
          throw new BadRequestException(
            'Email đã được đăng ký với tài khoản khác!',
          );
        }

        // update email
        await this.userService.changeEmail(user.id, newEmail);

        // delete OTP sau khi verify thành công
        await this.userVerifyRepo.delete({
          id: record.id,
        });
        break;
      }
      case VerificationType.CHANGE_PHONE: {
        const newPhone = record.metadata?.newPhone;
        if (typeof newPhone !== 'string') {
          throw new BadRequestException('Thiếu số điện thoại mới trong OTP!');
        }

        const existingUser = await this.userService.findUserByPhone(newPhone);

        if (existingUser) {
          throw new BadRequestException(
            'Số điện thoại đã được liên kết với tài khoản khác!',
          );
        }

        await this.userService.changePhone(user.id, newPhone);

        await this.userVerifyRepo.delete({
          id: record.id,
        });
        break;
      }
      default:
        throw new BadRequestException('OTP không hợp lệ!');
    }

    await this.userVerifyRepo.delete({
      user: {
        id: user.id,
      },
      type: record.type,
    });

    return { message: 'Xác thực thành công!' };
  }

  // resend change contact otp
  async resendChangeContactOtp(user: User) {
    const record = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        type: In([
          VerificationType.CHANGE_EMAIL,
          VerificationType.CHANGE_PHONE,
        ]),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!record) {
      throw new BadRequestException('Không có yêu cầu đổi!');
    }

    const cooldown = 60 * 1000;
    let expiredAtResult: null | Date = null;
    let message = '';
    switch (record.type) {
      case VerificationType.CHANGE_EMAIL: {
        if (
          record.createdAt &&
          Date.now() - record.createdAt.getTime() < cooldown
        ) {
          throw new BadRequestException('Vui lòng chờ trước khi gửi lại OTP!');
        }

        await this.userVerifyRepo.delete({
          user: { id: user.id },
          type: VerificationType.CHANGE_EMAIL,
        });

        const newEmail = record.metadata?.newEmail as string;
        const { token, expiredAt } = await this.createVerificationOtp(
          user.id,
          VerificationType.CHANGE_EMAIL,
          {
            newEmail,
          },
        );
        expiredAtResult = expiredAt;
        try {
          await this.mailService.sendOtp(newEmail, token);
        } catch (error) {
          console.log('Send mail failed=============>', error);
          throw new InternalServerErrorException('Gửi email thất bại!');
        }
        message = 'OTP đã được gửi đến email!';
        break;
      }
      case VerificationType.CHANGE_PHONE: {
        const cooldown = 60 * 1000;
        if (
          record.createdAt &&
          Date.now() - record.createdAt.getTime() < cooldown
        ) {
          throw new BadRequestException('Vui lòng chờ trước khi gửi lại OTP!');
        }

        await this.userVerifyRepo.delete({
          user: { id: user.id },
          type: VerificationType.CHANGE_PHONE,
        });

        const newPhone = record.metadata?.newPhone as string;
        const { token, expiredAt } = await this.createVerificationOtp(
          user.id,
          VerificationType.CHANGE_PHONE,
          {
            newPhone,
          },
        );
        expiredAtResult = expiredAt;
        console.log('==============> SMS token', token, expiredAt);
        message = 'OTP đã được gửi đến số điện thoại!';
        break;
      }
    }

    return {
      message,
      expiresAt: expiredAtResult,
    };
  }

  async changePassword(userId: number, data: ChangePassDto) {
    const { currentPassword, newPassword } = data;
    const user = await this.userService.findUserById(userId);

    if (user?.googleId && !user.password) {
      throw new BadRequestException('Tài khoản Google không thể đổi mật khẩu!');
    }

    if (!user || !user.password) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    const isMatch = await comparePass(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng!');
    }

    const hashed = await hashPass(newPassword);
    await this.userService.updatePassword(user.email, hashed);
    await this.userSessionService.revokeAllForUser(user.id);
  }

  async addPassword(userId: number, data: AddPasswordDto) {
    const { newPassword } = data;
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    if (user.password) {
      throw new BadRequestException('Tài khoản người dùng đã có mật khẩu!');
    }

    const hashPassword = await hashPass(newPassword);
    await this.userService.updatePassword(user.email, hashPassword);

    return {
      message: 'Thêm mật khẩu thành công!',
    };
  }

  async addToBlacklist(token: string) {
    const decode = this.jwtService.decode<JwtPayload>(token);
    if (!decode || typeof decode.exp !== 'number') {
      throw new Error('Invalid token');
    }
    const blacklistToken = this.blacklistTokenRepo.create({
      token,
      expiresAt: new Date(decode.exp * 1000),
    });
    await this.blacklistTokenRepo.save(blacklistToken);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.blacklistTokenRepo.findOne({
      where: { token: token },
    });
    return !!blacklisted;
  }

  async revokeSessionByRefreshToken(refreshToken: string) {
    return await this.userSessionService.revokeByRefreshToken(refreshToken);
  }

  async isSessionActive(sessionId: number, userId: number) {
    return await this.userSessionService.isActive(sessionId, userId);
  }

  async touchSession(sessionId: number) {
    return await this.userSessionService.touch(sessionId);
  }

  async findOrCreate(ggUser: GoogleUser) {
    const { email } = ggUser;
    if (!email) {
      throw new BadRequestException('Google account has no email');
    }
    let user = await this.userService.findUserByEmail(email);
    if (!user) {
      user = await this.userService.create({
        email,
        fullName: ggUser.name,
        avatar: ggUser.avatar,
        googleId: ggUser.googleId,
      });
    }

    if (user && !user.googleId) {
      await this.userService.updateSocialGoogle(user.id, ggUser.googleId);
    }

    const newUser = await this.userService.findUserById(user.id);
    if (!newUser) {
      throw new NotFoundException('User not found!');
    }
    return newUser;
  }

  async twoFactorSendOtp(userId: number, body: TwoFactorSendOtpDto) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }
    const { action, method } = body;

    if (action === 'enable' && user.two_factor_enabled) {
      throw new BadRequestException('2FA đã được bật!');
    }

    if (action === 'disable' && !user.two_factor_enabled) {
      throw new BadRequestException('2FA đã được tắt!');
    }

    const tokenType =
      action === 'enable'
        ? VerificationType.ENABLE_2FA
        : VerificationType.DISABLE_2FA;
    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      tokenType,
    );

    if (method === UserTwoFactorMethod.EMAIL) {
      await this.mailService.send2FaOtp(user.email, token, action);
    } else {
      console.log('===>', token);
    }

    return {
      message: `Đã gửi otp đến ${method === UserTwoFactorMethod.EMAIL ? 'email của bạn!' : 'SMS!'}`,
      data: {
        expiredAt,
      },
    };
  }

  async verify2FaOtp(userId: number, body: Verify2FaOtpDto) {
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    const { otp, action, method } = body;

    const verificationType =
      action === 'enable'
        ? VerificationType.ENABLE_2FA
        : VerificationType.DISABLE_2FA;

    const verification = await this.userVerifyRepo.findOne({
      where: {
        user: { id: userId },
        token: otp,
        type: verificationType,
      },
    });

    if (!verification) {
      throw new BadRequestException('Mã OTP không hợp lệ!');
    }

    if (verification.expiredAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn!');
    }

    if (action === 'enable') {
      await this.userService.update2fa(user.id, true, method);
      return {
        message: 'Đã bật xác minh 2 bước!',
      };
    }

    await this.userService.update2fa(user.id, false);

    return {
      message: 'Đã tắt xác minh 2 bước!',
    };
  }
}
