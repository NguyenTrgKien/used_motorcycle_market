import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { comparePass } from 'src/utils/handlePassword';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BlacklistToken } from '../blacklist_token/entities/blacklist_token.entity';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';

interface JwtPayload {
  exp: number;
  sub: number;
  email: string;
  role: string;
}

const client = new OAuth2Client(process.env.CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(BlacklistToken)
    private readonly blacklistTokenRepo: Repository<BlacklistToken>,
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

  async verifyGoogleToken(token: string): Promise<JwtPayload | null> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }
      return {
        sub: Number(payload['sub']),
        email: payload['email']!,
        role: 'user',
      } as JwtPayload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }

  async loginGoogle(token: string): Promise<User | null> {
    try {
      const payload = await this.verifyGoogleToken(token);
      if (!payload) {
        throw new Error('Invalid Google token');
      }
      const email = payload.email;
      let user = await this.userService.findUserByEmail(email);
      if (!user) {
        user = await this.userService.register({
          email,
          password: '',
        });
      }
      return user;
    } catch (error) {
      console.error('Lỗi khi xác thực token Google:', error);
      return null;
    }
  }
}
