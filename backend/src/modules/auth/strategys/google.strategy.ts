import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UserService } from 'src/modules/user/user.service';

export interface GoogleUser {
  email: string;
  name: string;
  googleId: string;
  avatar: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private readonly userService: UserService,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_SECRET');

    if (!clientID || !clientSecret) {
      throw new InternalServerErrorException('Missing Google OAuth config');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:8080/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    // tự động gán vào req.user của route callback khi return
    return {
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName,
      googleId: profile.id,
      avatar: profile.photos?.[0]?.value ?? '',
    };
  }
}
