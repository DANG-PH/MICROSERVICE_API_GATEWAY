import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/security/guard/ws-jwt.guard';
import { UseGuards } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import { SocialNetworkService } from '../social_network/social-network.service';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  namespace: '/ws-chat',
})
export class WsChatGateway {
  @WebSocketServer()
  server: Server;
  private redis: Redis;

  private socketActiveRooms = new Map<string, string>();
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly socialService: SocialNetworkService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || '')
  }

  async handleConnection(client: Socket) {
    // Nếu dùng cách 1 ở phần emitToUser thì cần đoạn logic này để join client vào room đó để nhận tin nhắn emit
    // Cách 2 thì không cần viết gì

    // try {
    //   const token = 
    //         client.handshake.auth?.token ||
    //         client.handshake.query?.token ||
    //         client.handshake.headers?.authorization?.split(' ')[1];
    //   if (!token) throw new Error('Missing token');

    //   const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
    //   client.data.user = payload;

    //   const userRooms = await this.redis.smembers(`hdgstudio::hdgstudio:USER_ROOMS:${payload.userId}`);
    //   userRooms.forEach(roomId => client.join(roomId));

    //   console.log('User connected:', payload.userId);
    // } catch (err) {
    //   console.error('Connection error:', err.message);
    //   client.disconnect();
    //   return;
    // }
  }

  handleDisconnect(client: Socket) {
    this.socketActiveRooms.delete(client.id);
  }

  // Hàm này cần để xử lí logic nghiệp vụ cho cách 2 của emitToUser
  /* ================= SET ACTIVE ROOM ================= */
  @SubscribeMessage('setActiveRoom')
  handleSetActiveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    if (!body?.roomId) return;

    this.socketActiveRooms.set(client.id, body.roomId);
  }

  /* ================= SEND MESSAGE ================= */

  @SubscribeMessage('chatMessage')
  async handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; content: string },
    ) {
    const { userId } = client.data.user;

    if (!body?.roomId || !body?.content) return;

    // Validate user có quyền chat trong room này
    const roomKey = `CHAT_ROOM:${body.roomId}`;
    const room = await this.cacheManager.get<{ users: string[] }>(roomKey);
    if (!room || !room?.users?.includes(userId)) {
        return; // không cho gửi
    }

    // Gửi tới Chat Service (lưu DB, xử lý logic)
    await this.sendToChatService({
        type: 'SEND_MESSAGE',
        userId,
        roomId: body.roomId,
        content: body.content,
    });
  }

  async emitToRoom(roomId: string, payload: any) {
    // Ở đây có 2 cách để gửi emit cho client:

    // Cách 1: Gửi hết cho client nào join vào room và kèm theo roomId để frontend tự lọc và tránh lỗi khi B đang chat với C mà nhảy hiện ra tin nhắn của A chen vào

      // console.log(roomId)
      // this.server.to(roomId).emit('chatMessage', payload);

    // Ưu điểm: Backend dễ triển khai, code dễ hiểu
    // Nhược điểm: Backend gửi emit thừa khiến hiệu năng giảm mạnh, bảo mật kém do trao quá nhiều quyền cho FE


    // Cách 2: Cache memory active room mỗi khi client nào gọi thì sẽ add roomId vào client đó ( nên là chỉ tồn tại 1 client cùng lúc - 1 tab vì nếu sang tab khác sẽ bị ghi đè lên roomId mới )
    //         Sau đó backend sẽ xem tất cả các client và so sánh 3 tiêu chí:
    //         + Phải có roomId trong cache memory trùng với roomId của lần gửi ( tránh việc B đang chat với C mà nhận được tin nhắn của A, vì B lúc này đang có room là dm:B:C còn A đang gửi dm:A:B )
    //         + Phải tồn tại userId từ token ( tránh hacker gian lận )
    //         + Check xem userId của client đó có được phép nhận tin nhắn k ( tránh hacker tiêm script nghe lén )
    const roomKey = `CHAT_ROOM:${roomId}`;
    const room = await this.cacheManager.get<{ users: number[] }>(roomKey);
    if (!room) return;

    // Lấy tất cả sockets trong namespace (async method)
    const allSockets = await this.server.fetchSockets();
    
    for (const socket of allSockets) {
      const socketRoom = this.socketActiveRooms.get(socket.id);
      const socketUserId = (socket.data as any).user?.userId;

      if (
        socketRoom === roomId &&
        socketUserId &&
        room.users.includes(socketUserId)
      ) {
        socket.emit('chatMessage', payload);
      }
    }
    // Ưu điểm: Bảo mật cao, hiệu năng ổn định
    // Nhược điểm: Code phức tạp hơn ở phía Backend
  }

  private async sendToChatService(command: any) {
    const [_, userA, userB] = command.roomId.split(':');
    const friendId = command.userId === +userA ? +userB : +userA;

    this.emitToRoom(command.roomId, {
        userId: command.userId,
        content: command.content,
        timestamp: new Date().toISOString(),
        roomId: command.roomId, // Có thể truyền thêm roomId nếu muốn client tự set xem roomId đang hiện trên màn hình có phải roomId này k để hiện tin nhắn
    });

    this.socialService.handleSaveMessage({
      message: {
        roomId: command.roomId,
        userId: command.userId,
        friendId: friendId,
        content: command.content,
        create_at: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      }
    })
  }
}
