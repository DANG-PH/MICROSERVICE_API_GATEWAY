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
  USER_SERVICE_NAME,
  Empty
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

  async handleProfile(req: GetUserRequest) {
    return grpcCall(this.userGrpcService.getProfile(req));
  }

  async handleSaveGame(req: SaveGameRequest) {
    return grpcCall(this.userGrpcService.saveGame(req));
  }

  async handleGetBalanceWeb(req: UsernameRequest ) {
    return grpcCall(this.userGrpcService.getBalance(req));
  }

  async handleUseVangWeb(req: UseBalanceRequest ) {
    return grpcCall(this.userGrpcService.useVangNapTuWeb(req));
  }

  async handleUseNgocWeb(req: UseBalanceRequest ) {
    return grpcCall(this.userGrpcService.useNgocNapTuWeb(req));
  }

  async handleAddVangWeb(req: AddBalanceRequest ) {
    return grpcCall(this.userGrpcService.addVangNapTuWeb(req));
  }

  async handleAddNgocWeb(req: AddBalanceRequest ) {
    return grpcCall(this.userGrpcService.addNgocNapTuWeb(req));
  }

  async handleUpdateBalance(req: UpdateBalanceRequest ) {
    return grpcCall(this.userGrpcService.updateBalance(req));
  }

  async handleAddItemWeb(req: AddItemRequest ) {
    return grpcCall(this.userGrpcService.addItemWeb(req));
  }

  async handleUseItemWeb(req: UseItemRequest ) {
    return grpcCall(this.userGrpcService.useItemWeb(req));
  }

  async handleGetItemWeb(req: UsernameRequest ) {
    return grpcCall(this.userGrpcService.getItemsWeb(req));
  }

  async handleGetTop10SucManh(req: Empty ) {
    return grpcCall(this.userGrpcService.getTop10BySucManh(req));
  }

  async handleGetTop10Vang(req: Empty ) {
    return grpcCall(this.userGrpcService.getTop10ByVang(req));
  }
}
