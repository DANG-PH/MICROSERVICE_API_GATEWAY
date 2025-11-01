import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  RegisterRequest,
  RegisterResponse,
  SaveGameRequest,
  SaveGameResponse,
  UserResponse,
  AddItemRequest,
  BalanceResponse,
  GetUserRequest,
  MessageResponse,
  UseItemRequest,
  ItemListResponse,
  UserListResponse,
  UsernameRequest,
  AddBalanceRequest,
  UseBalanceRequest,
  UpdateBalanceRequest,
  UserServiceClient,
  USER_PACKAGE_NAME,
  USER_SERVICE_NAME
} from 'proto/user.pb';
import { grpcCall } from 'src/HttpparseException/gRPC_to_Http';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private userGrpcService: UserServiceClient;

  constructor(
    @Inject(USER_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userGrpcService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async handleRegister(req: RegisterRequest) {
    return grpcCall(this.userGrpcService.register(req));
  }
}
