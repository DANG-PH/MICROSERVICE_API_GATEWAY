import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  AddFriendRequest,
  AddFriendResponse,
  GetSentFriendRequest,
  GetSentFriendResponse,
  GetIncomingFriendRequest,
  GetIncomingFriendResponse,
  AcceptFriendRequest,
  AcceptFriendResponse,
  RejectFriendRequest,
  RejectFriendResponse,
  GetAllFriendRequest,
  GetAllFriendResponse,
  UnfriendRequest,
  UnfriendResponse,
  BlockUserRequest,
  BlockUserResponse,
  CanChatRequest,
  CanChatResponse,
  SocialNetworkServiceClient,
  SOCIAL_NETWORK_SERVICE_NAME,
  SOCIALNETWORK_PACKAGE_NAME,
  SaveMessageRequest,
  SaveMessageResponse,
  GetMessageRequest,
  GetMessageResponse
} from 'proto/social-network.pb';
import { grpcCall } from 'src/HttpparseException/gRPC_to_Http';

@Injectable()
export class SocialNetworkService {
  private readonly logger = new Logger(SocialNetworkService.name);
  private socialNetworkService: SocialNetworkServiceClient;

  constructor(
    @Inject(SOCIALNETWORK_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.socialNetworkService = this.client.getService<SocialNetworkServiceClient>(SOCIAL_NETWORK_SERVICE_NAME);
  }

  async handleAddFriend(req: AddFriendRequest): Promise<AddFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.addFriend(req))
  }

  async handleGetSendFriend(req: GetSentFriendRequest): Promise<GetSentFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.getSentFriend(req))
  }

  async handleGetIncomingFriend(req: GetIncomingFriendRequest): Promise<GetIncomingFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.getIncomingFriend(req))
  }

  async handleAcceptFriend(req: AcceptFriendRequest): Promise<AcceptFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.acceptFriend(req))
  }

  async handleRejectFriend(req: RejectFriendRequest): Promise<RejectFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.rejectFriend(req))
  }

  async handleGetAllFriend(req: GetAllFriendRequest): Promise<GetAllFriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.getAllFriend(req))
  }

  async handleUnfriend(req: UnfriendRequest): Promise<UnfriendResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.unfriend(req))
  }

  async handleBlockUser(req: BlockUserRequest): Promise<BlockUserResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.blockUser(req))
  }

  async handleCanChat(req: CanChatRequest): Promise<CanChatResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.canChat(req))
  }

  async handleSaveMessage(req: SaveMessageRequest): Promise<SaveMessageResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.saveMessage(req))
  }

  async handleGetMessage(req: GetMessageRequest): Promise<GetMessageResponse> {
    return grpcCall(SocialNetworkService.name, this.socialNetworkService.getMessage(req))
  }
}
