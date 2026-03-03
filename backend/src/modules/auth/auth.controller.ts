import {
  Body,
  Controller,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { UserRole } from '@project/shared';
import type { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';

export interface RequestWithUser extends Request {
  user: User;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  async register(@Body() dataRegister: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(dataRegister);
    return this.handleLogin(user, res);
  }

  private handleLogin(user: User, res: Response, requiredRole?: UserRole) {
    if (requiredRole && user.role !== requiredRole) {
      throw new UnauthorizedException(
        `Chỉ ${requiredRole} mới được đăng nhập tại đây!`,
      );
    }

    const result = this.authService.login(user);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
    };

    res.cookie('access_token', result.access_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      status: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('/user/login')
  login(@Request() req: RequestWithUser, @Res() res: Response) {
    return this.handleLogin(req.user, res);
  }

  //   @UseGuards(LocalAuthGuard)
  //   @Post('/logout')
  //   logout(@Request() req) {
  //     return req.logout();
  //   }
}
