import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    SaveGameDeTuRequest,
    SaveGameDeTuResponse,
    CreateDeTuRequest,
    CreateDeTuResponse,
    GetDeTuRequest,
    DeTuResponse,
    DeTuServiceClient,
    DETU_PACKAGE_NAME,
    DE_TU_SERVICE_NAME
} from 'proto/detu.pb';
import { grpcCall } from 'src/HttpparseException/gRPC_to_Http';

@Injectable()
export class DeTuService {
  private readonly logger = new Logger(DeTuService.name);
  private deTuGrpcService: DeTuServiceClient;

  constructor(
    @Inject(DETU_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.deTuGrpcService = this.client.getService<DeTuServiceClient>(DE_TU_SERVICE_NAME);
  }

  async handleSaveDeTu(req: SaveGameDeTuRequest): Promise<SaveGameDeTuResponse> {
    return grpcCall(DeTuService.name,this.deTuGrpcService.saveGameDeTu(req));
  }

  async handleCreateDeTu(req: CreateDeTuRequest): Promise<CreateDeTuResponse> {
    return grpcCall(DeTuService.name,this.deTuGrpcService.createDeTu(req));
  }

  async handleGetDeTu(req: GetDeTuRequest): Promise<DeTuResponse> {
    return grpcCall(DeTuService.name,this.deTuGrpcService.getDeTuByUserId(req));
  }
}
