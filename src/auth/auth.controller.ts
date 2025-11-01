import { Controller, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { LoginRequest, RegisterRequest, RefreshRequest, VerifyOtpRequestDto,ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  ChangeEmailRequestDto,
  ChangeEmailResponseDto,
  ChangeRoleRequestDto,
  ChangeRoleResponseDto,
  BanUserRequestDto,
  BanUserResponseDto,
  UnbanUserRequestDto,
  UnbanUserResponseDto,RequestResetPasswordRequestDto, RequestResetPasswordResponseDto } from 'dto/auth.dto';
import { JwtAuthGuard } from 'src/JWT/jwt-auth.guard';
import { AuthService } from './auth.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/guard/role.guard';
import { UserService } from 'src/user/user.service';

@Controller('auth')
@ApiTags('Api Auth') 
export class AuthController {
  constructor(private readonly authService: AuthService,private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản user (qua gRPC)' })
  @ApiBody({ type:  RegisterRequest })
  async register(@Body() body: RegisterRequest) {
    const authResult = await this.authService.handleRegister(body); 
    if (!authResult.success) {
      return { success: false, message: 'Đăng ký auth thất bại' };
    }
    console.log(authResult)
    const userRequest = {
      id: authResult.auth_id, 
    };

    const userResult = await this.userService.handleRegister(userRequest);

    console.log(userRequest)

    return {
      auth: authResult,
      user: userResult,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập tài khoản user (qua gRPC)' })
  @ApiBody({ type:  LoginRequest })
  async login(@Body() body: LoginRequest) {
    return this.authService.handleLogin(body);
  }
  
  @Post('verify-otp')
  @ApiOperation({ summary: 'Bước 2: Xác thực OTP và nhận access + refresh token' })
  @ApiBody({ type: VerifyOtpRequestDto })
  async verifyOtp(@Body() body: VerifyOtpRequestDto) {
    return this.authService.handleVerifyOtp(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token bằng Refresh Token' })
  @ApiBody({ type: RefreshRequest })
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.handleRefresh(body);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thay đổi mật khẩu' })
  @ApiBody({ type: ChangePasswordRequestDto })
  async changePassword(@Body() body: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.authService.handleChangePassword(body);
  }

  @Patch('change-email')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thay đổi email' })
  @ApiBody({ type: ChangeEmailRequestDto })
  async changeEmail(@Body() body: ChangeEmailRequestDto): Promise<ChangeEmailResponseDto> {
    return this.authService.handleChangeEmail(body);
  }

  @Post('request-reset-password')
  @ApiOperation({ summary: 'Yêu cầu gửi OTP để reset mật khẩu' })
  @ApiBody({ type: RequestResetPasswordRequestDto })
  async requestResetPassword(
    @Body() body: RequestResetPasswordRequestDto
  ): Promise<RequestResetPasswordResponseDto> {
    return this.authService.handleRequestResetPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset mật khẩu khi quên' })
  @ApiBody({ type: ResetPasswordRequestDto })
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.authService.handleResetPassword(body);
  }

  @Patch('change-role')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Thay đổi role của user (ADMIN only)' })
  @ApiBody({ type: ChangeRoleRequestDto })
  async changeRole(@Body() body: ChangeRoleRequestDto): Promise<ChangeRoleResponseDto> {
    return this.authService.handleChangeRole(body);
  }

  @Patch('ban-user')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Ban user (ADMIN only)' })
  @ApiBody({ type: BanUserRequestDto })
  async banUser(@Body() body: BanUserRequestDto): Promise<BanUserResponseDto> {
    return this.authService.handleBanUser(body);
  }

  @Patch('unban-user')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Unban user (ADMIN only)' })
  @ApiBody({ type: UnbanUserRequestDto })
  async unbanUser(@Body() body: UnbanUserRequestDto): Promise<UnbanUserResponseDto> {
    return this.authService.handleUnbanUser(body);
  }
}