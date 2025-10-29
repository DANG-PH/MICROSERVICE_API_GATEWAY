import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  VerifyOtpRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ChangeEmailRequest,
  ChangeRoleRequest,
  BanUserRequest,
  UnbanUserRequest,
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  RequestResetPasswordRequest,
} from 'proto/auth.pb';
import { grpcCall } from 'src/HttpparseException/gRPC_to_Http';

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
    return grpcCall(this.authGrpcService.register(req));
  }

  async handleLogin(req: LoginRequest) {
    return grpcCall(this.authGrpcService.login(req), true);
  }

  async handleVerifyOtp(req: VerifyOtpRequest) {
    return grpcCall(this.authGrpcService.verifyOtp(req), true);
  }

  async handleRefresh(req: RefreshRequest) {
    return grpcCall(this.authGrpcService.refresh(req));
  }

  async handleChangePassword(req: ChangePasswordRequest) {
    return grpcCall(this.authGrpcService.changePassword(req));
  }

  async handleResetPassword(req: ResetPasswordRequest) {
    return grpcCall(this.authGrpcService.resetPassword(req));
  }

  async handleChangeEmail(req: ChangeEmailRequest) {
    return grpcCall(this.authGrpcService.changeEmail(req));
  }

  async handleChangeRole(req: ChangeRoleRequest) {
    return grpcCall(this.authGrpcService.changeRole(req));
  }

  async handleBanUser(req: BanUserRequest) {
    return grpcCall(this.authGrpcService.banUser(req));
  }

  async handleUnbanUser(req: UnbanUserRequest) {
    return grpcCall(this.authGrpcService.unbanUser(req));
  }
  async handleRequestResetPassword(req: RequestResetPasswordRequest) {
    return grpcCall(this.authGrpcService.requestResetPassword(req));
  }
}
