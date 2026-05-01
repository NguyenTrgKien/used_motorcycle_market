import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import type { Request as ExpressRequest, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { ForgotPassDto } from './dto/forgotPass.dto';
import { ResetPassDto } from './dto/resetPass.dto';

export interface RequestWithUser extends Request {
  user: User;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dataRegister: RegisterDto) {
    await this.authService.register(dataRegister);
    return {
      message:
        'Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản!',
    };
  }

  private handleLogin(user: User, res: Response) {
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
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  }

  @Public()
  @Post('/verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto, @Res() res: Response) {
    const user = await this.authService.verifyEmail(data);
    return this.handleLogin(user, res);
  }

  @Public()
  @Get('/resend-otp')
  resendOtp(@Query() query: { email: string }) {
    if (!query.email) {
      throw new BadRequestException('Vui lòng truyền email để gửi lại otp!');
    }
    return this.authService.resendOtp(query);
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() data: ForgotPassDto) {
    return this.authService.forgotPassword(data);
  }

  @Public()
  @Post('/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() data: VerifyEmailDto) {
    return this.authService.verifyOtp(data);
  }

  @Public()
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() data: ResetPassDto) {
    return this.authService.resetPassword(data);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Request() req: RequestWithUser, @Res() res: Response) {
    return this.handleLogin(req.user, res);
  }

  @Post('/logout')
  async logout(@Req() req: ExpressRequest, @Res() res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const access_token = cookies['access_token'] || null;

    if (!access_token) {
      return res.json({
        status: true,
        message: 'Bạn chưa đăng nhập!',
      });
    }

    await this.authService.addToBlacklist(access_token);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.json({
      status: true,
      message: 'Đăng xuất thành công!',
    });
  }

  @Get('/me')
  getMe(@Req() req: RequestWithUser) {
    const user = req.user;

    return {
      message: 'Đã đăng nhập!',
      user: {
        id: user.id,
        fullName: user.fullName,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  @Public()
  @Post('/login-google')
  async loginGoogle(@Body('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token Google không được cung cấp!');
    }

    const user = await this.authService.loginGoogle(token);
    if (!user) {
      throw new BadRequestException('Đăng nhập Google thất bại!');
    }
    return this.handleLogin(user, res);
  }
}
