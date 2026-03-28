import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  // Hàm thêm mới
  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(process.env.REDIS_URL || '');
    const subClient = pubClient.duplicate();
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  // @Override, Được chạy khi app.linsten, nhưng bên main.ts gọi connectToRedis trước nên luôn đúng
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options); // ← tạo Socket.IO Server bình thường
    server.adapter(this.adapterConstructor); // ← gắn Redis adapter vào ngay lúc tạo
    return server;
  }
}

// Luồng chi tiết — Cách cũ vs Cách mới

// Cách cũ (`afterInit`):
// 1. main.ts: app.listen(3000)
// 2. NestJS tạo Socket.IO Server
// 3. NestJS gọi afterInit()
//       └─ this.server.adapter(...)  ← BOOM, this.server vẫn là undefined
// 4. NestJS gán @WebSocketServer() vào this.server  ← quá muộn

// Cách mới (`main.ts`):
// 1. main.ts: redisIoAdapter.connectToRedis()
//       └─ adapterConstructor = createAdapter(pub, sub)  ← có giá trị rồi
// 2. main.ts: app.useWebSocketAdapter(redisIoAdapter)
//       └─ NestJS biết "dùng class này để tạo server"
// 3. main.ts: app.listen(3000)
//       └─ NestJS gọi createIOServer()
//             └─ super.createIOServer()  ← tạo Socket.IO Server bình thường
//             └─ server.adapter(this.adapterConstructor)  ← gắn Redis vào, lúc này adapterConstructor đã có
//             └─ return server
// 4. NestJS gán server vào @WebSocketServer()