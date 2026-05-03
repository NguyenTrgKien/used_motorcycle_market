import {
  BadRequestException,
  Injectable,
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
import { VerificationType } from '@project/shared';
import { MailService } from '../mail/mail.service';
import { ForgotPassDto } from './dto/forgotPass.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { GoogleUser } from './strategys/google.strategy';

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
        type: VerificationType.EMAIL,
        user: {
          id: user.id,
        },
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
    return user;
  }

  async resendOtp(query: { email: string }) {
    const email = query.email;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    const verifyToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 1000 * 60 * 5);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(UserVerification, {
        user: {
          id: user.id,
        },
        type: VerificationType.EMAIL,
      });
      await manager.save(UserVerification, {
        type: VerificationType.EMAIL,
        token: verifyToken,
        expiredAt,
        user: {
          id: user.id,
        },
      });
    });
    try {
      await this.mailService.sendVerifyEmail(email, verifyToken);
    } catch (error) {
      console.log('Send mail failed', error);
    }
  }

  async forgotPassword(data: ForgotPassDto) {
    const { email } = data;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    const verifyToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 1000 * 60 * 5);
    await this.userVerifyRepo.delete({
      user: { id: user.id },
      type: VerificationType.EMAIL,
    });
    await this.userVerifyRepo.save({
      type: VerificationType.EMAIL,
      token: verifyToken,
      expiredAt,
      user: {
        id: user.id,
      },
    });
    try {
      await this.mailService.sendVerifyEmail(email, verifyToken);
    } catch (error) {
      console.log('Send mail failed', error);
    }
    return { message: 'OTP đã được gửi về email!' };
  }

  async verifyOtp(data: VerifyEmailDto) {
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
        type: VerificationType.EMAIL,
        expiredAt: MoreThan(new Date()),
      },
    });
    if (!isValid)
      throw new BadRequestException('OTP không đúng hoặc đã hết hạn!');
    return { message: 'Xác thực thành công!' };
  }

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
        type: VerificationType.EMAIL,
      },
    });
    if (!isValid) throw new BadRequestException('Phiên xác thực hết hạn!');
    await this.userVerifyRepo.delete(isValid.id);
    const hashed = await hashPass(newPassword);
    await this.userService.updatePassword(email, hashed);
    return { message: 'Đặt lại mật khẩu thành công!' };
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
