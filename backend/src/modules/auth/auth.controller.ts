import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
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
import { AuthGuard } from '@nestjs/passport';
import { GoogleUser } from './strategys/google.strategy';
import { ChangePassDto } from './dto/changePass.dto';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { VerifyChangeEmailOtpDto } from './dto/verifyChangeEmail.dto';

export interface RequestWithUser extends Request {
  user: User;
}
export interface GoogleUserRequest extends Request {
  user: GoogleUser;
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
      // secure: true,
      // sameSite: 'none' as const,
      secure: false,
      sameSite: 'lax' as const,
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

  // Register OTP
  @Public()
  @Post('/verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto, @Res() res: Response) {
    const user = await this.authService.verifyEmail(data);
    return this.handleLogin(user, res);
  }

  // Resend verify account otp
  @Post('/resend-verification-otp')
  resendVerificationOtp(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.authService.resendVerificationOtp(user);
  }

  // validate password and send otp
  @Public()
  @Post('/forgot-password')
  forgotPassword(@Body() data: ForgotPassDto) {
    return this.authService.forgotPassword(data);
  }

  // Forgot password verify OTP
  @Public()
  @Post('/verify-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  verifyForgotPassOtp(@Body() data: VerifyEmailDto) {
    return this.authService.verifyForgotPassOtp(data);
  }

  // Reset password after verify OTP forgot password
  @Public()
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() data: ResetPassDto) {
    return this.authService.resetPassword(data);
  }

  @Patch('/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() data: ChangePassDto,
    @Res() res: Response,
  ) {
    const user = req.user;
    await this.authService.changePassword(user.id, data);

    res.clearCookie('access_token', {
      httpOnly: true,
      // secure: true,
      // sameSite: 'none',
      secure: false,
      sameSite: 'lax' as const,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      // secure: true,
      // sameSite: 'none',
      secure: false,
      sameSite: 'lax' as const,
    });

    return res.json({
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại!',
    });
  }

  // validate email and send otp to change email
  @Post('/email/change')
  @HttpCode(HttpStatus.OK)
  async requestChangeEmail(
    @Body() data: ChangeEmailDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return await this.authService.requestChangeEmail(user.id, data);
  }

  // Verify change email otp
  @Post('/verify-change-email-otp')
  @HttpCode(HttpStatus.OK)
  verifyChangeEmailOtp(
    @Body() data: VerifyChangeEmailOtpDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.authService.verifyChangeEmailOtp(user, data);
  }

  @Post('/resend-change-email-otp')
  resendChangeEmailOtp(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.authService.resendChangeEmailOtp(user);
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
      // secure: true,
      // sameSite: 'none',
      secure: false,
      sameSite: 'lax' as const,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      // secure: true,
      // sameSite: 'none',
      secure: false,
      sameSite: 'lax' as const,
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
        googleId: user.googleId,
        createdAt: user.createdAt,
        addresses: user.addresses,
      },
    };
  }

  // Cần cài thư viện passport-google-oauth20
  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('/login-google')
  loginGoogle() {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('/google/callback')
  async googleCallback(@Req() req: GoogleUserRequest, @Res() res: Response) {
    const user = req.user;
    const dataUser = await this.authService.findOrCreate(user);
    const result = this.authService.login(dataUser);
    const cookieOptions = {
      httpOnly: true,
      // secure: true,
      // sameSite: 'none' as const,
      secure: false,
      sameSite: 'lax' as const,
    };

    res.cookie('access_token', result.access_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect('http://localhost:5173');
  }
}
