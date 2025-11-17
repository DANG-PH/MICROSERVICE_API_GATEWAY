import { Controller, Post, Body, UseGuards, Patch, Req, Inject, Get } from '@nestjs/common';
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
  UnbanUserResponseDto,RequestResetPasswordRequestDto, RequestResetPasswordResponseDto, 
  ChangeRolePartnerRequestDto,
  ChangeRolePartnerResponseDto} from 'dto/auth.dto';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { AuthService } from './auth.service';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { UserService } from 'src/service/user/user.service';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { RequestWithUser } from 'src/interface/RequestWithUser.interface';

@Controller('auth')
@ApiTags('Api Auth') 
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản user (USER)(GAME/WEB)' })
  @ApiBody({ type:  RegisterRequest })
  async register(@Body() body: RegisterRequest, @Req() req: RequestWithUser) {
     const ip = req.headers['x-forwarded-for'] || req.ip;
    const key = `register_rate_limit_${ip}`;
    const limit = 1;  // 1 lần
    const ttl = 60;   // trong 60 giây

    let count = (await this.cacheManager.get<number>(key)) || 0;
    count++;

    if (count > limit) {
      throw new HttpException(
        'Bạn đang gửi yêu cầu nạp tiền, vui lòng thử lại sau 1 phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, count, ttl * 1000);

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
  @ApiOperation({ summary: 'Đăng nhập tài khoản user (USER)(GAME/WEB)' })
  @ApiBody({ type:  LoginRequest })
  async login(@Body() body: LoginRequest, @Req() req: Request) {
    const ip = req.ip;
    const key = `login_rate_limit_${ip}`;
    const limit = 6;  // 6 lần
    const ttl = 60;   // trong 60 giây

    let count = (await this.cacheManager.get<number>(key)) || 0;
    count++;

    if (count > limit) {
      throw new HttpException(
        'Bạn đăng nhập quá nhiều lần, vui lòng thử lại sau 1 phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, count, ttl * 1000);
    
    return this.authService.handleLogin(body);
  }
  
  @Post('verify-otp')
  @ApiOperation({ summary: 'Bước 2: Xác thực OTP và nhận access + refresh token (USER)(GAME/WEB)' })
  @ApiBody({ type: VerifyOtpRequestDto })
  async verifyOtp(@Body() body: VerifyOtpRequestDto) {
    const result = await this.authService.handleVerifyOtp(body);
    if (result.access_token) {
        const username = Buffer.from(body.sessionId, 'base64').toString('ascii');
        let onlineUsers = await this.cacheManager.get<string[]>('online_users') || [];
        let timeConLai = await this.cacheManager.ttl('online_users'); // trả về time hết hạn
        if (timeConLai) timeConLai = timeConLai-Date.now();
        else timeConLai = 60 * 1000;
        if (!onlineUsers.includes(username)) onlineUsers.push(username);
        await this.cacheManager.set('online_users', onlineUsers, timeConLai);
    }
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token bằng Refresh Token (USER)(GAME/WEB)' })
  @ApiBody({ type: RefreshRequest })
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.handleRefresh(body);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thay đổi mật khẩu (USER)(WEB)' })
  @ApiBody({ type: ChangePasswordRequestDto })
  async changePassword(@Body() body: ChangePasswordRequestDto, @Req() req: any): Promise<ChangePasswordResponseDto> {
    const username = req.user.username;
    const request = {
      ...body,
      sessionId: Buffer.from(username).toString('base64')
    }
    return this.authService.handleChangePassword(request);
  }

  @Patch('change-email')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thay đổi email (USER)(WEB)' })
  @ApiBody({ type: ChangeEmailRequestDto })
  async changeEmail(@Body() body: ChangeEmailRequestDto, @Req() req: any): Promise<ChangeEmailResponseDto> {
    const username = req.user.username;
    const request = {
      ...body,
      sessionId: Buffer.from(username).toString('base64')
    }
    return this.authService.handleChangeEmail(request);
  }

  @Post('request-reset-password')
  @ApiOperation({ summary: 'Yêu cầu gửi OTP để reset mật khẩu (USER)(WEB)' })
  @ApiBody({ type: RequestResetPasswordRequestDto })
  async requestResetPassword(
    @Body() body: RequestResetPasswordRequestDto
  ): Promise<RequestResetPasswordResponseDto> {
    return this.authService.handleRequestResetPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset mật khẩu khi quên (USER)(WEB)' })
  @ApiBody({ type: ResetPasswordRequestDto })
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.authService.handleResetPassword(body);
  }

  @Patch('change-role-partner')
  @ApiBearerAuth()
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Đổi role từ USER thành PARTNER để đăng bán acc (USER)(WEB)' })
  @ApiBody({ type: ChangeRolePartnerRequestDto })
  async changeRolePartner(@Req() req: any): Promise<ChangeRolePartnerResponseDto> {
    const username = req.user.username;
    return this.authService.handleChangeRolePartner(username);
  }

  @Get('profile/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User xem profile của chính mình (USER)(GAME/WEB)' })
  async profile(@Req() req: any) {
    const userId = req.user.userId;
    return this.authService.handleProfile({id: userId});
  }

  // chuyển sang player manager
  // @Patch('change-role')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Thay đổi role của user (ADMIN)(WEB)' })
  // @ApiBody({ type: ChangeRoleRequestDto })
  // async changeRole(@Body() body: ChangeRoleRequestDto): Promise<ChangeRoleResponseDto> {
  //   return this.authService.handleChangeRole(body);
  // }

  // @Patch('ban-user')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Ban user (ADMIN)(WEB)' })
  // @ApiBody({ type: BanUserRequestDto })
  // async banUser(@Body() body: BanUserRequestDto): Promise<BanUserResponseDto> {
  //   return this.authService.handleBanUser(body);
  // }

  // @Patch('unban-user')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Unban user (ADMIN)(WEB)' })
  // @ApiBody({ type: UnbanUserRequestDto })
  // async unbanUser(@Body() body: UnbanUserRequestDto): Promise<UnbanUserResponseDto> {
  //   return this.authService.handleUnbanUser(body);
  // }
}