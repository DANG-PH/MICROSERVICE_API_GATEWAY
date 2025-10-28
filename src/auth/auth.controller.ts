import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { LoginRequest, RegisterRequest, RefreshRequest, VerifyOtpRequestDto } from 'dto/auth.dto';
import { JwtAuthGuard } from 'src/JWT/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Api Auth') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản user (qua gRPC)' })
  @ApiBody({ type:  RegisterRequest })
  async register(@Body() body: RegisterRequest) {
    return this.authService.handleRegister(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập tài khoản user (qua gRPC)' })
  @ApiBody({ type:  LoginRequest })
  async login(@Body() body: LoginRequest) {
    return this.authService.handleLogin(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token bằng Refresh Token' })
  @ApiBody({ type: RefreshRequest })
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.handleRefresh(body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Bước 2: Xác thực OTP và nhận access + refresh token' })
  @ApiBody({ type: VerifyOtpRequestDto })
  async verifyOtp(@Body() body: VerifyOtpRequestDto) {
    return this.authService.handleVerifyOtp(body);
  }
}