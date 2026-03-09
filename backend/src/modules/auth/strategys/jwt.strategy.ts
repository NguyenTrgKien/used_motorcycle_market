import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { Request } from 'express';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET không được định nghĩa trong env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = req?.cookies as Record<string, string> | undefined;
          return cookies?.access_token ?? null;
        },
      ]),
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const cookies = req.cookies as Record<string, string>;
    const token = cookies['access_token'] ?? null;

    const isBlacklisted = await this.authService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException(
        'Token đã bị vô hiêu hóa! Vui lòng đăng nhập lại!',
      );
    }
    const user = await this.userService.findUserById(Number(payload.sub));
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại!');
    return {
      ...user,
    };
  }
}
