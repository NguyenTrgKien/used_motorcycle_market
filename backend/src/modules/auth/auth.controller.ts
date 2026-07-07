import {
  Body,
  Controller,
  Delete,
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
import { AuthService, LoginDeviceInfo } from './auth.service';
import { User } from '../user/entities/user.entity';
import { type Request as ExpressRequest, type Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { ForgotPassDto } from './dto/forgotPass.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { AuthGuard } from '@nestjs/passport';
import { GoogleUser } from './strategys/google.strategy';
import { AddPasswordDto, ChangePassDto } from './dto/changePass.dto';
import { ChangeContactDto } from './dto/changeContact.dto';
import { VerifyChangeContactOtpDto } from './dto/verifyChangeContact.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { TwoFactorSendOtpDto } from './dto/two-factor-send-otp.dto';
import { Verify2FaOtpDto } from './dto/verify-2fa-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';

export interface RequestWithUser extends ExpressRequest {
  user: User;
}
export interface GoogleUserRequest extends ExpressRequest {
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

  private async handleLogin(user: User, res: Response, req?: ExpressRequest) {
    const result = await this.authService.login(user, this.getDeviceInfo(req));

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
      two_factor_enabled: false,
    });
  }

  private getDeviceInfo(req?: ExpressRequest): LoginDeviceInfo {
    const userAgent = req?.get('user-agent') ?? undefined;
    const forwardedFor = req?.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || req?.ip;
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOs(userAgent);

    return {
      userAgent,
      ipAddress,
      browser,
      os,
      deviceName: [browser, os].filter(Boolean).join(' - ') || 'Unknown device',
    };
  }

  private detectBrowser(userAgent?: string) {
    if (!userAgent) return undefined;
    if (userAgent.includes('Edg/')) return 'Microsoft Edge';
    if (userAgent.includes('Chrome/')) return 'Chrome';
    if (userAgent.includes('Firefox/')) return 'Firefox';
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      return 'Safari';
    }
    return 'Unknown browser';
  }

  private detectOs(userAgent?: string) {
    if (!userAgent) return undefined;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad'))
      return 'iOS';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown OS';
  }

  @Post('/verify-password')
  @HttpCode(200)
  async verifyPassword(
    @Body() body: VerifyPasswordDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.authService.verifyPassword(body, user.id);
  }

  // Register OTP
  @Public()
  @Post('/verify-email')
  async verifyEmail(
    @Body() data: VerifyEmailDto,
    @Res() res: Response,
    @Req() req: ExpressRequest,
  ) {
    const user = await this.authService.verifyEmail(data);
    return this.handleLogin(user, res, req);
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

  // @Public()
  // @Post('/complete-reset-password')
  // @HttpCode(HttpStatus.OK)
  // compleResetPassword(@Body() data: CompleteResetPassDto) {
  //   return this.authService.compleResetPassword(data);
  // }

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

  @Post('/add-password')
  @HttpCode(HttpStatus.OK)
  async addPassword(@Req() req: RequestWithUser, @Body() data: AddPasswordDto) {
    const user = req.user;
    await this.authService.addPassword(user.id, data);
  }

  // validate email and send otp to change email
  @Post('/contact/change')
  @HttpCode(HttpStatus.OK)
  async requestChangeContact(
    @Body() data: ChangeContactDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return await this.authService.requestChangeContact(user.id, data);
  }

  // Verify change email otp
  @Post('/verify-change-contact-otp')
  @HttpCode(HttpStatus.OK)
  verifyChangeContactOtp(
    @Body() data: VerifyChangeContactOtpDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.authService.verifyChangeContactOtp(user, data);
  }

  @Post('/resend-change-contact-otp')
  resendChangeContactOtp(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.authService.resendChangeContactOtp(user);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req: RequestWithUser, @Res() res: Response) {
    const userId = req.user.id;

    const result = await this.authService.checkTwoFactorEnabled(userId);
    if (result.two_factor_enabled) {
      const otpResult = await this.authService.sendOtpLogin(result.user);
      return res.status(HttpStatus.OK).json(otpResult);
    } else {
      return this.handleLogin(req.user, res, req as unknown as ExpressRequest);
    }
  }

  @Public()
  @Post('/verify-login-otp')
  async verifyLoginOtp(
    @Body() body: VerifyLoginOtpDto,
    @Res() res: Response,
    @Req() req: ExpressRequest,
  ) {
    const user = await this.authService.verifyLoginOtp(body);
    return this.handleLogin(user, res, req);
  }

  @Public()
  @Post('/refresh')
  async refresh(@Req() req: ExpressRequest, @Res() res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const refresh_token = cookies['refresh_token'] || null;

    if (!refresh_token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        message: 'Phien dang nhap khong hop le',
      });
    }

    const result = await this.authService.refreshAccessToken(refresh_token);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      status: true,
      message: 'Lam moi access token thanh cong',
    });
  }

  @Post('/logout')
  async logout(@Req() req: ExpressRequest, @Res() res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const access_token = cookies['access_token'] || null;
    const refresh_token = cookies['refresh_token'] || null;

    if (!access_token && !refresh_token) {
      return res.json({
        status: true,
        message: 'Bạn chưa đăng nhập!',
      });
    }

    if (access_token) {
      await this.authService.addToBlacklist(access_token);
    }

    if (refresh_token) {
      await this.authService.revokeSessionByRefreshToken(refresh_token);
    }

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
  async getMe(@Req() req: RequestWithUser) {
    const user = req.user;
    const result = await this.authService.getMe(user.id);

    return {
      ...result,
      message: 'Lấy thông tin cá nhân thành công!',
    };
  }

  @Get('/security-settings')
  async getDataSecuritySetting(@Req() req: RequestWithUser) {
    const user = req.user;
    const result = await this.authService.getDataSecuritySetting(user.id);
    return {
      ...result,
      message: 'Lấy thông tin bảo mật thành công!',
    };
  }

  // Cần cài thư viện passport-google-oauth20
  @Delete('/account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: RequestWithUser, @Res() res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const accessToken = cookies['access_token'] || null;
    const user = req.user;

    await this.authService.deleteAccount(user.id, accessToken);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
    });

    return res.json({
      message: 'Xoa tai khoan thanh cong!',
    });
  }

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
    const result = await this.authService.login(
      dataUser,
      this.getDeviceInfo(req),
    );
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

  @Patch('/2fa/send-otp')
  twoFactorSendOtp(
    @Req() req: RequestWithUser,
    @Body() body: TwoFactorSendOtpDto,
  ) {
    const userId = req.user.id;
    return this.authService.twoFactorSendOtp(userId, body);
  }

  @Patch('/2fa/verify-otp')
  verify2FaOtp(@Req() req: RequestWithUser, @Body() body: Verify2FaOtpDto) {
    const userId = req.user.id;
    return this.authService.verify2FaOtp(userId, body);
  }
}
