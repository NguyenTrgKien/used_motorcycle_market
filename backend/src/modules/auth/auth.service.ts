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
import {
  DataSource,
  EntityManager,
  In,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { UserStatus, UserTwoFactorMethod, VerificationType } from 'src/shared';
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
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  RequestPhoneVerificationDto,
  ResendPhoneVerificationDto,
  VerifyPhoneVerificationDto,
} from './dto/phone-verification.dto';
import { PhoneOtpDeliveryService } from './phone-otp-delivery.service';

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
    private readonly phoneOtpDeliveryService: PhoneOtpDeliveryService,
  ) {}

  private readonly phoneOtpRequests = new Map<string, number[]>();

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
      token: await hashPass(token),
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

  private async ensureOtpCooldown(userId: number, type: VerificationType) {
    const latestOtp = await this.userVerifyRepo.findOne({
      where: { user: { id: userId }, type },
      order: { createdAt: 'DESC' },
    });
    if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < 60_000) {
      throw new BadRequestException(
        'Vui lòng chờ 60 giây trước khi yêu cầu OTP mới!',
      );
    }
  }

  private async validateOtp(
    verification: UserVerification | null,
    otp: string,
  ) {
    if (!verification) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn!');
    }
    if (verification.expiredAt <= new Date()) {
      await this.userVerifyRepo.delete(verification.id);
      throw new BadRequestException(
        'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới!',
      );
    }
    if (verification.failedAttempts >= 5) {
      await this.userVerifyRepo.delete(verification.id);
      throw new BadRequestException(
        'Mã OTP đã bị khóa do nhập sai quá nhiều lần!',
      );
    }
    let valid = false;
    try {
      valid = await comparePass(otp, verification.token);
    } catch {
      valid = false;
    }
    if (!valid) {
      const failedAttempts = verification.failedAttempts + 1;
      await this.userVerifyRepo.update(verification.id, { failedAttempts });
      if (failedAttempts >= 5) {
        await this.userVerifyRepo.delete(verification.id);
        throw new BadRequestException(
          'Mã OTP đã bị khóa do nhập sai quá nhiều lần!',
        );
      }
      throw new BadRequestException('Mã OTP không chính xác!');
    }
    return verification;
  }

  private async validateOtpInTransaction(
    manager: EntityManager,
    verification: UserVerification | null,
    otp: string,
  ) {
    if (!verification) {
      return new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn!');
    }
    if (verification.expiredAt <= new Date()) {
      await manager.delete(UserVerification, verification.id);
      return new BadRequestException(
        'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới!',
      );
    }
    if (verification.failedAttempts >= 5) {
      await manager.delete(UserVerification, verification.id);
      return new BadRequestException(
        'Mã OTP đã bị khóa do nhập sai quá nhiều lần!',
      );
    }
    const valid = await comparePass(otp, verification.token).catch(() => false);
    if (!valid) {
      const failedAttempts = verification.failedAttempts + 1;
      if (failedAttempts >= 5) {
        await manager.delete(UserVerification, verification.id);
        return new BadRequestException(
          'Mã OTP đã bị khóa do nhập sai quá nhiều lần!',
        );
      }
      await manager.update(UserVerification, verification.id, {
        failedAttempts,
      });
      return new BadRequestException('Mã OTP không chính xác!');
    }
    return verification;
  }

  private enforcePhoneOtpRateLimit(userId: number, ipAddress?: string) {
    const now = Date.now();
    const windowStart = now - 10 * 60 * 1000;
    const keys = [`user:${userId}`, ...(ipAddress ? [`ip:${ipAddress}`] : [])];
    const requestsByKey = new Map<string, number[]>();
    for (const key of keys) {
      const requests = (this.phoneOtpRequests.get(key) || []).filter(
        (requestedAt) => requestedAt > windowStart,
      );
      if (requests.length >= 5) {
        throw new BadRequestException(
          'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau!',
        );
      }
      requestsByKey.set(key, requests);
    }
    for (const [key, requests] of requestsByKey) {
      this.phoneOtpRequests.set(key, [...requests, now]);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredVerifications() {
    await this.userVerifyRepo.delete({
      expiredAt: LessThanOrEqual(new Date()),
    });
    const windowStart = Date.now() - 10 * 60 * 1000;
    for (const [key, requests] of this.phoneOtpRequests) {
      const activeRequests = requests.filter(
        (requestedAt) => requestedAt > windowStart,
      );
      if (activeRequests.length) this.phoneOtpRequests.set(key, activeRequests);
      else this.phoneOtpRequests.delete(key);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findUserByEmail(
      email.trim().toLowerCase(),
    );

    if (user && user.password) {
      const compareP = await comparePass(password, user.password);
      if (compareP) {
        if (user.status !== UserStatus.ACTIVE) {
          throw new BadRequestException('Tài khoản đã bị khóa!');
        }
        if (!user.isVerified) {
          throw new BadRequestException(
            'Tài khoản chưa được xác minh. Vui lòng xác minh email!',
          );
        }
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
    await this.ensureOtpCooldown(user.id, VerificationType.LOGIN);
    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      VerificationType.LOGIN,
    );
    if (user.two_factor_method === UserTwoFactorMethod.SMS) {
      if (!user.phone || !user.phoneVerifiedAt) {
        throw new BadRequestException('Số điện thoại chưa được xác minh!');
      }
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'Dịch vụ SMS chưa được cấu hình!',
        );
      }
      console.log('LOGIN_TWO_FACTOR_OTP', token);
    } else if (user.two_factor_method === UserTwoFactorMethod.AUTHENTICATOR) {
      throw new BadRequestException(
        'Phương thức Authenticator chưa được hỗ trợ!',
      );
    } else {
      await this.mailService.sendLoginOtp(user.email, token);
    }
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

    const validVerification = await this.validateOtp(verification, body.otp);

    await this.userVerifyRepo.delete({
      id: validVerification.id,
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
        type: VerificationType.REGISTER_EMAIL,
        user: {
          id: user.id,
        },
      },
      order: { createdAt: 'DESC' },
    });
    const validRecord = await this.validateOtp(record, data.otp);

    await this.userService.updateVerify(user.id, true);
    await this.userVerifyRepo.delete(validRecord.id);
    const userUpdated = await this.userService.findUserById(user.id);
    return userUpdated as User;
  }

  // Resend verification otp with userId and type
  async resendVerificationOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existUser = await this.userService.findUserByEmail(normalizedEmail);
    if (!existUser) {
      return { message: 'Nếu email tồn tại, OTP mới sẽ được gửi về email!' };
    }

    if (existUser.isVerified) {
      throw new BadRequestException('Tài khoản đã xác thực!');
    }

    const latestOtp = await this.userVerifyRepo.findOne({
      where: {
        user: { id: existUser.id },
        type: VerificationType.REGISTER_EMAIL,
      },
      order: { createdAt: 'DESC' },
    });
    if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < 60_000) {
      throw new BadRequestException(
        'Vui lòng chờ 60 giây trước khi gửi lại OTP!',
      );
    }
    const { token, expiredAt } = await this.createVerificationOtp(
      existUser.id,
      VerificationType.REGISTER_EMAIL,
    );

    try {
      await this.mailService.sendOtp(normalizedEmail, token);
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
      return { message: 'Nếu email tồn tại, OTP sẽ được gửi về email!' };
    }

    if (user.googleId && !user.password) {
      throw new BadRequestException('Tài khoản đăng nhập bằng google!');
    }

    await this.ensureOtpCooldown(user.id, VerificationType.RESET_PASSWORD);

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
    const verification = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        type: VerificationType.RESET_PASSWORD,
      },
      order: { createdAt: 'DESC' },
    });
    const isValid = await this.validateOtp(verification, otp);
    await this.userVerifyRepo.update(isValid.id, {
      verifiedAt: new Date(),
    });
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
      await this.validateOtp(isValid, otp);
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

  normalizePhone(phone: string) {
    const compact = phone.replace(/[\s.-]/g, '');
    if (/^0\d{9}$/.test(compact)) return `+84${compact.slice(1)}`;
    if (/^84\d{9}$/.test(compact)) return `+${compact}`;
    if (/^\+84\d{9}$/.test(compact)) return compact;
    throw new BadRequestException('Số điện thoại Việt Nam không hợp lệ!');
  }

  // Validate email / phone and send otp to new email / phone
  async requestChangeContact(userId: number, data: ChangeContactDto) {
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    const isEmail = this.isEmail(data.contact);
    if (!isEmail) {
      throw new BadRequestException(
        'Vui lòng sử dụng API xác minh số điện thoại!',
      );
    }
    const contact = data.contact.trim().toLowerCase();

    const latestOtp = await this.userVerifyRepo.findOne({
      where: {
        user: { id: user.id },
        type: VerificationType.CHANGE_EMAIL,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < 60_000) {
      throw new BadRequestException('Vui lòng chờ trước khi yêu cầu OTP mới!');
    }

    if (user.email === contact) {
      throw new BadRequestException(
        'Email mới không được trùng với email hiện tại!',
      );
    }
    const existingUser = await this.userService.findUserByEmail(contact);
    if (existingUser) throw new BadRequestException('Email đã được đăng ký!');
    const { token } = await this.createVerificationOtp(
      user.id,
      VerificationType.CHANGE_EMAIL,
      { newEmail: contact },
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

  async requestPhoneVerification(
    userId: number,
    data: RequestPhoneVerificationDto,
    ipAddress?: string,
  ) {
    const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng!');

    const expectedType = user.phone
      ? VerificationType.CHANGE_PHONE
      : VerificationType.ADD_PHONE;
    if (data.type !== expectedType) {
      throw new BadRequestException(
        'Loại xác minh không phù hợp với trạng thái số điện thoại!',
      );
    }
    if (expectedType === VerificationType.CHANGE_PHONE) {
      if (!data.password) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại!');
      }
      await this.verifyPassword({ password: data.password }, userId);
    }

    const phone = this.normalizePhone(data.phone);
    if (user.phone === phone) {
      throw new BadRequestException(
        'Số điện thoại mới không được trùng số hiện tại!',
      );
    }
    if (await this.userService.findUserByPhone(phone)) {
      throw new BadRequestException(
        'Số điện thoại đã được liên kết với tài khoản khác!',
      );
    }

    await this.ensureOtpCooldown(userId, expectedType);
    this.phoneOtpDeliveryService.ensureAvailable();
    this.enforcePhoneOtpRateLimit(userId, ipAddress);
    await this.userVerifyRepo.delete({
      user: { id: userId },
      type: In([VerificationType.ADD_PHONE, VerificationType.CHANGE_PHONE]),
    });
    const { token, expiredAt } = await this.createVerificationOtp(
      userId,
      expectedType,
      { newPhone: phone },
    );
    await this.phoneOtpDeliveryService.send(phone, token);
    return {
      message: 'OTP đã được tạo cho số điện thoại!',
      expiresAt: expiredAt,
      cooldownEndsAt: new Date(Date.now() + 60_000),
      type: expectedType,
    };
  }

  async verifyPhoneVerification(
    userId: number,
    data: VerifyPhoneVerificationDto,
  ) {
    const verificationType = data.type as VerificationType;
    const otpError = await this.dataSource.transaction(async (manager) => {
      const record = await manager
        .createQueryBuilder(UserVerification, 'verification')
        .setLock('pessimistic_write')
        .where('verification.user_id = :userId', { userId })
        .andWhere('verification.type = :type', { type: verificationType })
        .orderBy('verification.createdAt', 'DESC')
        .getOne();
      const validRecord = await this.validateOtpInTransaction(
        manager,
        record,
        data.otp,
      );
      if (validRecord instanceof BadRequestException) return validRecord;
      const newPhone = validRecord.metadata?.newPhone;
      if (typeof newPhone !== 'string') {
        throw new BadRequestException('Thiếu số điện thoại trong yêu cầu OTP!');
      }
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('Không tìm thấy người dùng!');
      const expectedType = user.phone
        ? VerificationType.CHANGE_PHONE
        : VerificationType.ADD_PHONE;
      if (verificationType !== expectedType) {
        throw new BadRequestException('Yêu cầu OTP không còn phù hợp!');
      }
      const existingUser = await manager.findOne(User, {
        where: { phone: newPhone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException(
          'Số điện thoại đã được liên kết với tài khoản khác!',
        );
      }
      try {
        await manager.update(User, userId, {
          phone: newPhone,
          phoneVerifiedAt: new Date(),
        });
      } catch (error: unknown) {
        const errorCode =
          typeof error === 'object' && error && 'code' in error
            ? (error as { code?: string }).code
            : undefined;
        if (errorCode === '23505' || errorCode === 'ER_DUP_ENTRY') {
          throw new BadRequestException(
            'Số điện thoại đã được liên kết với tài khoản khác!',
          );
        }
        throw error;
      }
      await manager.delete(UserVerification, {
        user: { id: userId },
        type: In([VerificationType.ADD_PHONE, VerificationType.CHANGE_PHONE]),
      });
      return null;
    });
    if (otpError) throw otpError;
    return { message: 'Xác minh số điện thoại thành công!' };
  }

  async resendPhoneVerification(
    userId: number,
    data: ResendPhoneVerificationDto,
    ipAddress?: string,
  ) {
    const verificationType = data.type as VerificationType;
    const record = await this.userVerifyRepo.findOne({
      where: { user: { id: userId }, type: verificationType },
      order: { createdAt: 'DESC' },
    });
    if (!record)
      throw new BadRequestException('Không có yêu cầu xác minh số điện thoại!');
    await this.ensureOtpCooldown(userId, verificationType);
    const phone = record.metadata?.newPhone;
    if (typeof phone !== 'string') {
      throw new BadRequestException('Thiếu số điện thoại trong yêu cầu OTP!');
    }
    this.phoneOtpDeliveryService.ensureAvailable();
    this.enforcePhoneOtpRateLimit(userId, ipAddress);
    const { token, expiredAt } = await this.createVerificationOtp(
      userId,
      verificationType,
      { newPhone: phone },
    );
    await this.phoneOtpDeliveryService.send(phone, token);
    return {
      message: 'OTP mới đã được tạo cho số điện thoại!',
      expiresAt: expiredAt,
      cooldownEndsAt: new Date(Date.now() + 60_000),
      type: verificationType,
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
        type: VerificationType.CHANGE_EMAIL,
      },
      order: { createdAt: 'DESC' },
    });
    const validRecord = await this.validateOtp(record, otp);

    switch (validRecord.type) {
      case VerificationType.CHANGE_EMAIL: {
        const newEmail = validRecord.metadata?.newEmail;

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
          id: validRecord.id,
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
      type: validRecord.type,
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
        type: VerificationType.CHANGE_EMAIL,
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
    if (!user.isVerified) {
      await this.userService.updateVerify(user.id, true);
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
    const effectiveMethod =
      action === 'enable' ? method : user.two_factor_method;

    if (action === 'enable' && user.two_factor_enabled) {
      throw new BadRequestException('2FA đã được bật!');
    }

    if (action === 'disable' && !user.two_factor_enabled) {
      throw new BadRequestException('2FA đã được tắt!');
    }
    if (!effectiveMethod) {
      throw new BadRequestException('Vui lòng chọn phương thức xác thực 2FA!');
    }
    if (effectiveMethod === UserTwoFactorMethod.AUTHENTICATOR) {
      throw new BadRequestException(
        'Phương thức Authenticator chưa được hỗ trợ!',
      );
    }
    if (
      effectiveMethod === UserTwoFactorMethod.SMS &&
      (!user.phone || !user.phoneVerifiedAt)
    ) {
      throw new BadRequestException(
        'Vui lòng xác minh số điện thoại trước khi dùng SMS 2FA!',
      );
    }

    const tokenType =
      action === 'enable'
        ? VerificationType.ENABLE_2FA
        : VerificationType.DISABLE_2FA;
    await this.ensureOtpCooldown(user.id, tokenType);
    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      tokenType,
    );

    if (effectiveMethod === UserTwoFactorMethod.EMAIL) {
      await this.mailService.send2FaOtp(user.email, token, action);
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'Phương thức 2FA này chưa được cấu hình!',
        );
      }
      console.log('TWO_FACTOR_OTP', token);
    }

    return {
      message: `Đã gửi otp đến ${effectiveMethod === UserTwoFactorMethod.EMAIL ? 'email của bạn!' : 'SMS!'}`,
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
        type: verificationType,
      },
    });
    const validVerification = await this.validateOtp(verification, otp);
    await this.userVerifyRepo.delete(validVerification.id);

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
