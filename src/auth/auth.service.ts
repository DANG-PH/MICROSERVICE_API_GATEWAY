import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  VerifyOtpRequest,
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
} from 'proto/auth.pb';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private authGrpcService: AuthServiceClient;

  constructor(
    @Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authGrpcService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async handleRegister(req: RegisterRequest) {
    this.logger.debug('Body nhận được: ' + JSON.stringify(req));
    return await firstValueFrom(this.authGrpcService.register(req));
  }

  async handleLogin(req: LoginRequest) {
    this.logger.log('🔹 Đang xử lý đăng nhập cho user: ' + req.username);
    const res = await lastValueFrom(this.authGrpcService.login(req));
    return res;
  }

  async handleVerifyOtp(req: VerifyOtpRequest) {
    this.logger.log('🔐 Xác thực OTP cho session: ' + req.sessionId);
    return await lastValueFrom(this.authGrpcService.verifyOtp(req));
  }

  async handleRefresh(req: RefreshRequest) {
    this.logger.log('🔁 Refresh token...');
    return await firstValueFrom(this.authGrpcService.refresh(req));
  }
}