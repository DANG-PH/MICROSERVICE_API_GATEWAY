import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
    Empty,
    Item,
    ItemIdRequest,
    ItemResponse,
    ItemServiceClient,
    ITEM_PACKAGE_NAME,
    ItemServiceController,
    ItemServiceControllerMethods,
    ItemsResponse,
    ITEM_SERVICE_NAME,
    AddItemRequest,
    AddMultipleItemsRequest,
    MessageResponse,
    UserIdRequest
} from 'proto/item.pb';
import { grpcCall } from 'src/HttpparseException/gRPC_to_Http';

@Injectable()
export class ItemService {
  private readonly logger = new Logger(ItemService.name);
  private itemGrpcService: ItemServiceClient;

  constructor(
    @Inject(ITEM_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.itemGrpcService = this.client.getService<ItemServiceClient>(ITEM_SERVICE_NAME);
  }

  async handleGetItemByUser(req: UserIdRequest): Promise<ItemsResponse> {
    return grpcCall(this.itemGrpcService.getItemsByUser(req));
  }

  async handleAddItem(req: AddItemRequest): Promise<ItemResponse> {
    return grpcCall(this.itemGrpcService.addItem(req));
  }
  
  async handleUpdateItem(req: Item): Promise<ItemResponse> {
    return grpcCall(this.itemGrpcService.updateItem(req));
  }

  async handleDeleteItem(req: ItemIdRequest): Promise<MessageResponse> {
    return grpcCall(this.itemGrpcService.deleteItem(req));
  }

  async handleAddMultiItem(req: AddMultipleItemsRequest): Promise<ItemsResponse> {
    return grpcCall(this.itemGrpcService.addMultipleItems(req));
  }
}
