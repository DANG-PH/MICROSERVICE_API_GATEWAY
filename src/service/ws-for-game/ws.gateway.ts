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
import { UserService } from '../user/user.service';
import { Double } from 'mongodb';
import { Item } from 'proto/item.pb';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';
import { createAdapter } from '@socket.io/redis-adapter';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  namespace: '/ws-game',
  pingTimeout: 10000,   // chờ 10s không có pong → disconnect
  pingInterval: 5000,   // ping mỗi 5s
})
export class WsGateway {
  @WebSocketServer()
  server: Server;
  private redis: Redis;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject(String(process.env.RABBIT_SERVICE)) private readonly queueClient: ClientProxy,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || '')
  }

  async afterInit(server: Server) {
    // Tạo 1 Redis connection để PUBLISH (gửi message)
    const pubClient = new Redis(process.env.REDIS_URL || '');
    
    // Tạo thêm 1 connection nữa để SUBSCRIBE (lắng nghe message)
    // duplicate() = copy y hệt config, nhưng là connection riêng biệt
    // duplicate() thay thế cho việc viết tay thế này:
    // const subClient = new Redis(process.env.REDIS_URL || '');  // y hệt
    const subClient = pubClient.duplicate();

    // Gắn adapter vào Socket.IO server
    server.adapter(createAdapter(pubClient, subClient));
  }

  async handleConnection(client: Socket) {
    try {
      const token = 
              client.handshake.auth?.token ||
              client.handshake.query?.token ||
              client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect(); 
        return;
      }
      
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });

      // Lấy gameSessionId từ handshake thay vì từ JWT
      const gameSessionId = client.handshake.auth?.gameSessionId;
      if (!gameSessionId) {
        client.disconnect();
        return;
      }

      // Check gameSessionId có match với session đang active của user không
      const currentGameSessionId = await this.redis.get(`user:${payload.userId}:gameSession`);
      if (currentGameSessionId !== gameSessionId) {
        client.disconnect();
        return;
      }

      client.data.user = { ...payload, gameSessionId };

      const userId = payload.userId;
      const state = await this.userService.handleGetPosition({ userId });

      await this.redis.hset(`GAME:PLAYER:${userId}`, {
        x: state.x,
        y: state.y,
        map: state.map,
        trangthai: 'DUNG_YEN',
        dir: 1,
        dau: "nhanvat/traidat/avatar/Goku_base/daudung.png",
        than: "nhanvat/traidat/do/set_base/thandung.png",
        chan: "nhanvat/traidat/do/set_base/chandung.png",
        timeChoHienBay: 0,
        lechDauX: -0.3,
        lechDauY: 15.5,
        lechThanX: 0,
        lechThanY: 0,
        lechChanX: 0,
        lechChanY: 0,
        frameVanBay: 1,
        dangMangVanBay: false,
        tenVanBay: "base",
        rong: 50,
        cao: 50,
        gameName: state.gameName,
        avatar: "nhanvat/traidat/avatar/Goku_base/daudung.png",
      });

      await this.redis.sadd(`GAME:MAP:${state.map}`, userId);

      client.join(`MAP:${state.map}`);
      client.data.map = state.map;

      const players = await this.getPlayersInMap(state.map);
      client.emit('mapSnapshot', players);

      client.to(`MAP:${state.map}`).emit('playerSpawn', {
        userId,
        x: state.x,
        y: state.y,
        trangthai: 'DUNG_YEN',
        dir: 1,
        dau: "nhanvat/traidat/avatar/Goku_base/daudung.png",
        than: "nhanvat/traidat/do/set_base/thandung.png",
        chan: "nhanvat/traidat/do/set_base/chandung.png",
        timeChoHienBay: 0,
        lechDauX: -0.3,
        lechDauY: 15.5,
        lechThanX: 0,
        lechThanY: 0,
        lechChanX: 0,
        lechChanY: 0,
        frameVanBay: 1,
        dangMangVanBay: false,
        tenVanBay: "base",
        rong: 50,
        cao: 50,
        gameName: state.gameName,
        avatar: "nhanvat/traidat/avatar/Goku_base/daudung.png",
      });

      client.join(`Game:${payload.userId}`);
      client.join(`NotificationGame`);

      if (payload.role === 'ADMIN') {
        client.to(`NotificationGame`).emit('notification', { tinNhan: `Đại đế ${state.gameName} đã online tại ${state.map}` });
      }
    } catch (e) {
      client.disconnect(); 
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.userId;
    const map = client.data.map;
    if (!userId) return;

    const state = await this.redis.hgetall(`GAME:PLAYER:${userId}`);
    if (!state || !state.x) return;

    await this.userService.handleSavePosition({
      userId,
      x: Number(state.x),
      y: Number(state.y),
      map: state.map,
    });

    await this.redis.del(`GAME:PLAYER:${userId}`);

    if (map) {
      await this.redis.srem(`GAME:MAP:${map}`, userId);
      client.to(`MAP:${map}`).emit('playerDespawn', { userId });
    }
  }

  @SubscribeMessage('setMap')
  async handleSetMap(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { oldMap:string, map: string, x: number, y: number, dir: number, trangthai: string, dau: string, than: string, chan: string, timeChoHienBay: Double, lechDauX: Double, lechDauY: Double, lechThanX: Double, lechThanY: Double, lechChanX: Double, lechChanY: Double, frameVanBay: number, dangMangVanBay: string, tenVanBay: string, rong: Double, cao: Double, avatar: string },
  ) {
    const userId = client.data.user.userId;

    const state = await this.redis.hgetall(`GAME:PLAYER:${userId}`);
    await this.userService.handleSavePosition({
      userId,
      x: Number(state.x),
      y: Number(state.y),
      map: body.oldMap,
    });

    if (body.oldMap) {
      await this.redis.srem(`GAME:MAP:${body.oldMap}`, userId);
      client.leave(`MAP:${body.oldMap}`);
      client.to(`MAP:${body.oldMap}`).emit('playerDespawn', { userId });
    }

    await this.redis.hset(`GAME:PLAYER:${userId}`, {
      map: body.map,
      x: body.x,
      y: body.y,
      trangthai: body.trangthai,
      dir: body.dir,
      dau: body.dau,
      than: body.than,
      chan: body.chan,
      timeChoHienBay: body.timeChoHienBay,
      lechDauX: body.lechDauX,
      lechDauY: body.lechDauY,
      lechThanX: body.lechThanX,
      lechThanY: body.lechThanY,
      lechChanX: body.lechChanX,
      lechChanY: body.lechChanY,
      frameVanBay: body.frameVanBay,
      dangMangVanBay: body.dangMangVanBay,
      tenVanBay: body.tenVanBay,
      rong: body.rong,
      cao: body.cao,
      gameName: state.gameName,
      avatar: body.avatar,
    });

    await this.redis.sadd(`GAME:MAP:${body.map}`, userId);

    client.join(`MAP:${body.map}`);
    client.data.map = body.map;

    const players = await this.getPlayersInMap(body.map);
    client.emit('mapSnapshot', players);

    client.to(`MAP:${body.map}`).emit('playerSpawn', {
      userId,
      x: body.x,
      y: body.y,
      trangthai: body.trangthai,
      dir: body.dir,
      dau: body.dau,
      than: body.than,
      chan: body.chan,
      timeChoHienBay: body.timeChoHienBay,
      lechDauX: body.lechDauX,
      lechDauY: body.lechDauY,
      lechThanX: body.lechThanX,
      lechThanY: body.lechThanY,
      lechChanX: body.lechChanX,
      lechChanY: body.lechChanY,
      frameVanBay: body.frameVanBay,
      dangMangVanBay: body.dangMangVanBay,
      tenVanBay: body.tenVanBay,
      rong: body.rong,
      cao: body.cao,
      gameName: state.gameName,
      avatar: body.avatar,
    });
  }


  @SubscribeMessage('player-move')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { x: number, y: number, trangthai: string, dir: number, dau: string, than: string, chan: string, timeChoHienBay: Double, lechDauX: Double, lechDauY: Double, lechThanX: Double, lechThanY: Double, lechChanX: Double, lechChanY: Double, frameVanBay: number, dangMangVanBay: string, tenVanBay: string, rong: Double, cao: Double, avatar: string },
    ) {
    const { userId } = client.data.user;

    const map = client.data.map;

    this.redis.hset(`GAME:PLAYER:${userId}`, {
      x: body.x,
      y: body.y,
      trangthai: body.trangthai,
      dir: body.dir,
      dau: body.dau,
      than: body.than,
      chan: body.chan,
      timeChoHienBay: body.timeChoHienBay,
      lechDauX: body.lechDauX,
      lechDauY: body.lechDauY,
      lechThanX: body.lechThanX,
      lechThanY: body.lechThanY,
      lechChanX: body.lechChanX,
      lechChanY: body.lechChanY,
      frameVanBay: body.frameVanBay,
      dangMangVanBay: body.dangMangVanBay,
      tenVanBay: body.tenVanBay,
      rong: body.rong,
      cao: body.cao,
      avatar: body.avatar,
    });

    this.server.to(`MAP:${map}`).emit('playerSync', {
      userId,
      x: body.x,
      y: body.y,
      trangthai: body.trangthai,
      dir: body.dir,
      dau: body.dau,
      than: body.than,
      chan: body.chan,
      timeChoHienBay: body.timeChoHienBay,
      lechDauX: body.lechDauX,
      lechDauY: body.lechDauY,
      lechThanX: body.lechThanX,
      lechThanY: body.lechThanY,
      lechChanX: body.lechChanX,
      lechChanY: body.lechChanY,
      frameVanBay: body.frameVanBay,
      dangMangVanBay: body.dangMangVanBay,
      tenVanBay: body.tenVanBay,
      rong: body.rong,
      cao: body.cao,
      avatar: body.avatar,
    });
  }

  @SubscribeMessage('player-chat')
  async handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { message: string }
  ) {
    const { userId } = client.data.user;
    const map = client.data.map;

    if (!body.message || body.message.length > 200) return;

    const cleanMessage = censorMessage(body.message);

    this.server.to(`MAP:${map}`).emit('playerChat', {
      userId,
      message: cleanMessage,
    });
  }

  @SubscribeMessage('add-item')
  async handleAddItem(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tmpId:number, item: Item }
  ) {
    console.log('Received add-item:', JSON.stringify(body)); 
    const { userId } = client.data.user;

    if (!body.item) {
      console.log('Item is null/undefined, returning early')
      return;
    }

    const uuid = uuidv4();

    body.item.uuid = uuid;
    body.item.userId = userId;

    this.queueClient.emit('save_item', { data: body.item });

    client.emit('addItem', { tmpId: body.tmpId, uuid: uuid });
  }

  @SubscribeMessage('send-notification')
  async handleNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tinNhan: string },
  ) {
    // Room to, gui all User dang online
    client.to(`NotificationGame`).emit('notification', { tinNhan: body.tinNhan });
  }

  // TODO: 1, Thêm 1 api gửi items Id vào để check xem đúng người sở hữu item đó không 
  //       2, Thêm 1 api gửi items Id và nhận lại các thông số item để render thông tin item ở client 
  // Gọi khi User A muốn gửi yêu cầu giao dịch cho User B
  @SubscribeMessage('trade:request')
  async handleTradeItem(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { targetId: number },
  ) {
    const userId = client.data.user.userId;
    const state = await this.redis.hgetall(`GAME:PLAYER:${userId}`);
    if (!state) return;
    client.to(`Game:${body.targetId}`).emit('trade:request', { fromUserId: userId });
  }

  // Gọi khi User B accept yêu cầu giao dịch của User A
  @SubscribeMessage('trade:accept')
  async tradeAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { fromUserId: number },
  ) {
    const userId = client.data.user.userId;

    // set trạng thái giao dịch trong Redis
    const mySession = await this.redis.get(`GAME:TRADE:SESSION:${userId}`);
    const otherSession = await this.redis.get(`GAME:TRADE:SESSION:${body.fromUserId}`);
    if (mySession || otherSession) {
      // có thể emit lỗi cho client nếu muốn
      return;
    }

    const sessionId = userId < body.fromUserId ? `${userId}:${body.fromUserId}` : `${body.fromUserId}:${userId}`;

    await this.redis
      .multi()
      .set(`GAME:TRADE:SESSION:${userId}`, sessionId, 'EX', 300)
      .set(`GAME:TRADE:SESSION:${body.fromUserId}`, sessionId, 'EX', 300)
      .set(`GAME:TRADE:STATE:${sessionId}`, 'OPEN', 'EX', 300)
      .exec();

    // server quyết định mở giao dịch
    // Gửi cho cả 2 để cả 2 hiện popup giao dịch
    this.server.to(`Game:${userId}`).emit('trade:open', { with: body.fromUserId });
    this.server.to(`Game:${body.fromUserId}`).emit('trade:open', { with: userId });

  }

  // Gọi event khi 1 trong 2 hủy giao dịch
  @SubscribeMessage('trade:cancel')
  async tradeCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number },
  ) {
    const userId = client.data.user.userId;
    const withUserId = body.withUserId;

    const sessionId =
      userId < withUserId ? `${userId}:${withUserId}` : `${withUserId}:${userId}`;

    const mySession = await this.redis.get(`GAME:TRADE:SESSION:${userId}`);
    if (mySession !== sessionId) return; // fake packet hoặc trade khác

    await this.redis.multi()
      .del(`GAME:TRADE:SESSION:${userId}`)
      .del(`GAME:TRADE:SESSION:${withUserId}`)
      .del(`GAME:TRADE:STATE:${sessionId}`)
      .del(`GAME:TRADE:OFFER:${sessionId}:${userId}`)
      .del(`GAME:TRADE:OFFER:${sessionId}:${withUserId}`)
      .del(`GAME:TRADE:LOCK:${sessionId}:${userId}`)
      .del(`GAME:TRADE:LOCK:${sessionId}:${withUserId}`)
      .del(`GAME:TRADE:CONFIRM:${sessionId}:${userId}`)
      .del(`GAME:TRADE:CONFIRM:${sessionId}:${withUserId}`)
      .exec();

    // Gửi cho cả 2 để tắt popup và hiện thông báo gd bị hủy ( thông báo pet ở client )
    this.server.to(`Game:${withUserId}`).emit('trade:cancelled', { by: userId });
    this.server.to(`Game:${userId}`).emit('trade:cancelled', { by: userId });
    this.server.to(`Game:${withUserId}`).emit('notification', { tinNhan: "Giao dịch đã bị hủy" });
    this.server.to(`Game:${userId}`).emit('notification', { tinNhan: "Giao dịch đã bị hủy" });
  }

  @SubscribeMessage('trade:offer:add')
  async tradeOfferAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number; itemUuid: string },
  ) {
    const userId = client.data.user.userId;
    const { withUserId, itemUuid } = body;

    let sessionId: string;
    let state: string;

    try {
      ({ sessionId, state } = await this.getValidSession(userId, withUserId));
    } catch {
      return;
    }

    if (state !== 'OPEN') return;

    const locked = await this.redis.get(`GAME:TRADE:LOCK:${sessionId}:${userId}`);
    if (locked) return;

    const key = `GAME:TRADE:OFFER:${sessionId}:${userId}`;
    const current = JSON.parse((await this.redis.get(key)) || '[]');

    // Tránh add trùng ngay tại server
    if (current.some(i => i.itemUuid === itemUuid)) return;

    current.push({ itemUuid });
    await this.redis.set(key, JSON.stringify(current), 'EX', 300);

    // Chỉ gửi đúng 1 item mới + action
    this.server.to(`Game:${withUserId}`).emit('trade:offer:update', {
      from: userId,
      action: 'add',
      itemUuid,
    });
  }

  @SubscribeMessage('trade:offer:remove')
  async tradeOfferRemove(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number; itemUuid: string },
  ) {
    const userId = client.data.user.userId;
    const { withUserId, itemUuid } = body;

    let sessionId: string;
    let state: string;

    try {
      ({ sessionId, state } = await this.getValidSession(userId, withUserId));
    } catch {
      return;
    }

    if (state !== 'OPEN') return;

    const locked = await this.redis.get(`GAME:TRADE:LOCK:${sessionId}:${userId}`);
    if (locked) return;

    const key = `GAME:TRADE:OFFER:${sessionId}:${userId}`;
    const current = JSON.parse((await this.redis.get(key)) || '[]');
    const next = current.filter(i => i.itemUuid !== itemUuid);

    await this.redis.set(key, JSON.stringify(next), 'EX', 300);

    // Remove không cần gửi data item, client tự xóa theo uuid
    this.server.to(`Game:${withUserId}`).emit('trade:offer:update', {
      from: userId,
      action: 'remove',
      itemUuid,
    });
  }

  @SubscribeMessage('trade:lock')
  async tradeLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number },
  ) {
    const userId = client.data.user.userId;

    let sessionId: string;
    let state: string;

    try {
      ({ sessionId, state } = await this.getValidSession(userId, body.withUserId));
    } catch {
      return;
    }

    if (state !== 'OPEN') return;

    await this.redis.set(`GAME:TRADE:LOCK:${sessionId}:${userId}`, 1, 'EX', 300);

    // Gửi cho user B để user B đổi hiệu ứng ô gd từ xám thành đen
    this.server.to(`Game:${body.withUserId}`).emit('trade:locked', { by: userId });

    const key = `GAME:TRADE:OFFER:${sessionId}:${userId}`;
    const current = JSON.parse((await this.redis.get(key)) || '[]');
    this.server.to(`Game:${body.withUserId}`).emit('trade:offer:final', {
      from: userId,
      items: current,
    });

    const otherLocked = await this.redis.get(`GAME:TRADE:LOCK:${sessionId}:${body.withUserId}`);
    if (otherLocked) {
      await this.redis.set(`GAME:TRADE:STATE:${sessionId}`, 'LOCKED', 'EX', 300);

      // Gửi để hiện nút "Xong" ở client khi cả 2 đã khóa (Thay cho "Khóa" và "Đợi" (Trạng thái này k cho click nút nữa))
      this.server.to(`Game:${userId}`).emit('trade:bothLocked');
      this.server.to(`Game:${body.withUserId}`).emit('trade:bothLocked');

      // 2 event này ở client sẽ làm việc là gọi để gửi xem cả 2 người đều đủ ô hành trang để chứa các vật phẩm mới không
    }
  }

  // Sau khi cả 2 ấn khóa, sẽ tự gọi event này
  @SubscribeMessage('trade:check')
  async tradeCheck(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number, oConTrongBanThan: number },
  ) {
    const userId = client.data.user.userId;
    const withUserId = body.withUserId;

    let sessionId: string;
    let state: string;

    try {
      ({ sessionId, state } = await this.getValidSession(userId, withUserId));
    } catch {
      return;
    }

    if (state !== 'LOCKED') return;

    // Lấy danh sách item mà user sẽ NHẬN
    const otherOfferKey = `GAME:TRADE:OFFER:${sessionId}:${withUserId}`;
    const otherOffer = JSON.parse((await this.redis.get(otherOfferKey)) || '[]');

    const soItemSeNhan = otherOffer.length;


    if (body.oConTrongBanThan < soItemSeNhan) {
      // huỷ giao dịch cho cả 2
      await this.redis.set(`GAME:TRADE:STATE:${sessionId}`, 'CANCELLED', 'EX', 30);

      await this.redis.multi()
        .del(`GAME:TRADE:SESSION:${userId}`)
        .del(`GAME:TRADE:SESSION:${withUserId}`)
        .del(`GAME:TRADE:STATE:${sessionId}`)
        .del(`GAME:TRADE:OFFER:${sessionId}:${userId}`)
        .del(`GAME:TRADE:OFFER:${sessionId}:${withUserId}`)
        .del(`GAME:TRADE:LOCK:${sessionId}:${userId}`)
        .del(`GAME:TRADE:LOCK:${sessionId}:${withUserId}`)
        .del(`GAME:TRADE:CONFIRM:${sessionId}:${userId}`)
        .del(`GAME:TRADE:CONFIRM:${sessionId}:${withUserId}`)
        .exec();

      this.server.to(`Game:${userId}`).emit('trade:cancelled', { by: userId });
      this.server.to(`Game:${withUserId}`).emit('trade:cancelled', { by: userId });

      this.server.to(`Game:${userId}`).emit('notification', {
        tinNhan: 'Hành trang không đủ chỗ trống để nhận đồ',
      });
      this.server.to(`Game:${withUserId}`).emit('notification', {
        tinNhan: 'Đối phương không đủ chỗ trống trong hành trang',
      });

      return;
    }

    // Đánh dấu user này đã CHECK OK
    await this.redis.set(
      `GAME:TRADE:CHECK_OK:${sessionId}:${userId}`,
      1,
      'EX',
      120,
    );

    // Tạm thời chưa cần logic đằng sau ( khi nào client cần thông báo sau khi check thành công thì cần )

    // const otherChecked = await this.redis.get(
    //   `GAME:TRADE:CHECK_OK:${sessionId}:${withUserId}`,
    // );

    // // Khi cả 2 đều OK → cho phép confirm
    // if (otherChecked) {
    //   this.server.to(`Game:${userId}`).emit('trade:check:ok');
    //   this.server.to(`Game:${withUserId}`).emit('trade:check:ok');
    // }
  }

  // Sau khi đầy đủ điều kiện có thể confirm giao dịch
  @SubscribeMessage('trade:confirm')
  async tradeConfirm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: number },
  ) {
    const userId = client.data.user.userId;

    let sessionId: string;
    let state: string;

    try {
      ({ sessionId, state } = await this.getValidSession(userId, body.withUserId));
    } catch {
      return;
    }

    if (state !== 'LOCKED') return;

    await this.redis.set(`GAME:TRADE:CONFIRM:${sessionId}:${userId}`, 1, 'EX', 300);

    const otherConfirmed = await this.redis.get(
      `GAME:TRADE:CONFIRM:${sessionId}:${body.withUserId}`,
    );

    if (!otherConfirmed) return;

    const bothChecked = await Promise.all([
      this.redis.get(`GAME:TRADE:CHECK_OK:${sessionId}:${userId}`),
      this.redis.get(`GAME:TRADE:CHECK_OK:${sessionId}:${body.withUserId}`),
    ]);

    if (!bothChecked[0] || !bothChecked[1]) return;

    // TODO: 1, Thực hiện swap item trong DB (transaction + lock inventory) (call item-service)
    //       2, Giải quyết bài toán race-condition khi user lợi dụng item vừa giao dịch vừa đăng bán (trên web) cùng lúc nếu sau này có tính năng đó

    await this.redis.multi()
      .del(`GAME:TRADE:SESSION:${userId}`)
      .del(`GAME:TRADE:SESSION:${body.withUserId}`)
      .del(`GAME:TRADE:STATE:${sessionId}`)
      .del(`GAME:TRADE:OFFER:${sessionId}:${userId}`)
      .del(`GAME:TRADE:OFFER:${sessionId}:${body.withUserId}`)
      .del(`GAME:TRADE:LOCK:${sessionId}:${userId}`)
      .del(`GAME:TRADE:LOCK:${sessionId}:${body.withUserId}`)
      .del(`GAME:TRADE:CONFIRM:${sessionId}:${userId}`)
      .del(`GAME:TRADE:CONFIRM:${sessionId}:${body.withUserId}`)
      .exec();

    // Gửi để tắt popup và thông báo cho cả 2
    this.server.to(`Game:${userId}`).emit('trade:success');
    this.server.to(`Game:${body.withUserId}`).emit('trade:success');
  }


  private getSessionId(a: number, b: number) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  private async getValidSession(userId: number, withUserId: number) {
    const sessionId = this.getSessionId(userId, withUserId);

    const mySession = await this.redis.get(`GAME:TRADE:SESSION:${userId}`);
    if (mySession !== sessionId) throw new Error('INVALID_SESSION');

    const state = await this.redis.get(`GAME:TRADE:STATE:${sessionId}`);
    if (!state) throw new Error('NO_TRADE');

    return { sessionId, state };
  }

  async getPlayersInMap(map: string) {
    const userIds = await this.redis.smembers(`GAME:MAP:${map}`);
    if (!userIds.length) return [];

    const pipeline = this.redis.pipeline();

    userIds.forEach(id => {
      pipeline.hgetall(`GAME:PLAYER:${id}`);
    });

    const results = await pipeline.exec();
    if (!results) return [];

    return results.map((result, index) => {
      const [err, state] = result;

      if (err || !state) return null;

      const playerState = state as Record<string, string>;

      return {
        userId: Number(userIds[index]),
        x: Number(playerState.x),
        y: Number(playerState.y),
        trangthai: playerState.trangthai ?? 'DUNG_YEN',
        dir: Number(playerState.dir ?? 1),
        dau: playerState.dau,
        than: playerState.than,
        chan: playerState.chan,
        timeChoHienBay: playerState.timeChoHienBay,
        lechDauX: playerState.lechDauX,
        lechDauY: playerState.lechDauY,
        lechThanX: playerState.lechThanX,
        lechThanY: playerState.lechThanY,
        lechChanX: playerState.lechChanX,
        lechChanY: playerState.lechChanY,
        frameVanBay: playerState.frameVanBay,
        dangMangVanBay: playerState.dangMangVanBay,
        tenVanBay: playerState.tenVanBay,
        rong: playerState.rong,
        cao: playerState.cao,
        gameName: playerState.gameName,
        avatar: playerState.avatar,
      };
    }).filter(Boolean);
  }

  async kickSocket(userId: number) {
    this.server.to(`Game:${userId}`).emit('force_logout', {
      message: 'Tài khoản đăng nhập ở nơi khác',
    });

    // Khác gì setTimeOut thường, setTimeOut thường vẫn chạy dòng sau à
    await new Promise(resolve => setTimeout(resolve, 100));
    // Disconnect socket qua adapter (Socket.IO hỗ trợ sẵn)
    this.server.in(`Game:${userId}`).disconnectSockets(true);
  }
}

function censorMessage(message: string): string {
  const BAD_WORDS = ['dm', 'đm', 'vcl', 'cc', 'lol'];
  let result = message;

  for (const word of BAD_WORDS) {
    const regex = new RegExp(word, 'gi');
    result = result.replace(regex, '*'.repeat(word.length));
  }

  return result;
}
