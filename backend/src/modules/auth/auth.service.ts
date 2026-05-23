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
import { DataSource, MoreThan, Repository } from 'typeorm';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { VerificationType } from 'src/shared';
import { MailService } from '../mail/mail.service';
import { ForgotPassDto } from './dto/forgotPass.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { GoogleUser } from './strategys/google.strategy';
import { ChangePassDto } from './dto/changePass.dto';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { VerifyChangeEmailOtpDto } from './dto/verifyChangeEmail.dto';
import { randomInt } from 'crypto';

interface JwtPayload {
  exp: number;
  sub: number;
  email: string;
  role: string;
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

  login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    // const refreshTokenHash = await hashPass(refresh_token);
    // await this.userService.saveRefreshToken(user.id, refreshTokenHash);

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

    await this.userService.updateUser(user.id, { isVerified: true });
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

    if (user.googleId) {
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
    if (!isValid) throw new BadRequestException('Phiên xác thực hết hạn!');
    await this.userVerifyRepo.delete(isValid.id);
    const hashed = await hashPass(newPassword);
    await this.userService.updatePassword(email, hashed);
    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  // Validate email and send otp to new email
  async requestChangeEmail(userId: number, data: ChangeEmailDto) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    if (user.email === data.newEmail) {
      throw new BadRequestException(
        'Email mới không được trùng với email hiện tại!',
      );
    }

    const { newEmail } = data;
    const existEmail = await this.userService.findUserByEmail(newEmail);
    if (existEmail) {
      throw new BadRequestException('Email người dùng đã được đăng ký!');
    }

    const { token } = await this.createVerificationOtp(
      user.id,
      VerificationType.CHANGE_EMAIL,
      {
        newEmail,
      },
    );
    try {
      await this.mailService.sendOtp(newEmail, token);
    } catch (error) {
      console.log('Send mail failed ==============>', error);
      throw new InternalServerErrorException('Gửi email thất bại!');
    }
    return {
      message: 'OTP đã gửi tới email mới!',
    };
  }

  // Verify otp new email
  async verifyChangeEmailOtp(user: User, data: VerifyChangeEmailOtpDto) {
    const { otp } = data;

    const record = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        token: otp,
        type: VerificationType.CHANGE_EMAIL,
        expiredAt: MoreThan(new Date()),
      },
    });
    console.log('==========>', record);

    if (!record) {
      throw new BadRequestException('OTP không đúng hoặc đã hết hạn!');
    }

    const newEmail = record.metadata?.newEmail as string;

    if (!newEmail) {
      throw new BadRequestException('Thiếu email mới trong OTP!');
    }

    // update email
    await this.userService.changeEmail(user.id, newEmail);

    // delete OTP sau khi verify thành công
    await this.userVerifyRepo.delete({
      id: record.id,
    });

    return { message: 'Xác thực thành công!' };
  }

  // resend change email otp
  async resendChangeEmailOtp(user: User) {
    const record = await this.userVerifyRepo.findOne({
      where: {
        user: {
          id: user.id,
        },
        type: VerificationType.CHANGE_EMAIL,
      },
    });
    if (!record) {
      throw new BadRequestException('Không có yêu cầu đổi email!');
    }

    const cooldown = 60 * 1000;
    if (
      record.createdAt &&
      Date.now() - record.createdAt.getTime() < cooldown
    ) {
      throw new BadRequestException('Vui lòng chờ trước khi gửi lại OTP!');
    }

    const newEmail = record.metadata?.newEmail as string;
    const { token, expiredAt } = await this.createVerificationOtp(
      user.id,
      VerificationType.CHANGE_EMAIL,
      {
        newEmail,
      },
    );
    try {
      await this.mailService.sendOtp(newEmail, token);
    } catch (error) {
      console.log('Send mail failed=============>', error);
      throw new InternalServerErrorException('Gửi email thất bại!');
    }
    return {
      message: 'OTP mới đã được gửi về email!',
      expiresAt: expiredAt,
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
      const { data } = await this.userService.updateUser(user.id, {
        googleId: ggUser.googleId,
      });
      user = data;
    }

    return user;
  }
}
