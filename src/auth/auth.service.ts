import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  VerifyOtpRequest,
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
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
}
