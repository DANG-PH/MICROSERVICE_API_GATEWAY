# Redis Adapter cho Socket.IO trong NestJS

## Mục lục

- [Bài toán đặt ra](#bài-toán-đặt-ra)
- [Giải pháp: Redis Pub/Sub Adapter](#giải-pháp-redis-pubsub-adapter)
- [Cơ chế Pub/Sub — luồng emit chi tiết](#cơ-chế-pubsub--luồng-emit-chi-tiết)
- [Tại sao cần 2 Redis client riêng biệt?](#tại-sao-cần-2-redis-client-riêng-biệt)
- [Setup theo thứ tự đúng](#setup-theo-thứ-tự-đúng)
- [Code đầy đủ](#code-đầy-đủ)
- [Tại sao chọn Redis Pub/Sub, không phải cách khác?](#tại-sao-chọn-redis-pubsub-không-phải-cách-khác)
- [Tóm tắt](#tóm-tắt)

---

## Bài toán đặt ra

Socket.IO theo mặc định lưu trạng thái room và socket trong **bộ nhớ của từng process**. Khi ứng dụng chỉ có một instance thì không có vấn đề gì. Nhưng khi scale lên nhiều instance (nhiều process hoặc nhiều máy chủ):

```
Client A ──kết nối──▶ Instance 1  (biết về A)
Client B ──kết nối──▶ Instance 2  (biết về B)

Instance 2 gọi: io.to("room:chat").emit("message", data)
  → Instance 2 không biết A đang ở room:chat
  → Message bị mất với Client A
```

**Nguyên nhân cốt lõi**: Mỗi instance chỉ biết về các socket *đang kết nối trực tiếp với nó*. Không có cơ chế chia sẻ trạng thái giữa các instance.

---

## Giải pháp: Redis Pub/Sub Adapter

Dùng Redis làm **message broker trung gian**: mọi lệnh `emit` đều được publish lên Redis channel, tất cả instance subscribe channel đó và tự quyết định client nào của mình cần nhận message.

```
Instance 1 ──PUBLISH──▶ Redis ──fan-out──▶ Instance 1 (subClient)
                                        └──▶ Instance 2 (subClient)
                                        └──▶ Instance 3 (subClient)
```

Mỗi instance sau khi nhận từ Redis sẽ kiểm tra local state để forward đến đúng client của nó.

---

## Cơ chế Pub/Sub — luồng emit chi tiết

Khi gọi `io.to("room:42").emit("message", data)`:

### Bước 1 — Serialize và publish

Redis adapter nhận lệnh emit, serialize payload cùng metadata (tên room, tên event, namespace).

```
pubClient.publish("socket.io#/#room:42#", serializedPayload)
```

### Bước 2 — Redis fan-out

Redis gửi message đến **tất cả** subscriber đang lắng nghe channel này — tức là tất cả instance của ứng dụng.

> Redis không giữ danh sách socket hay room. Đó là local state của mỗi instance. Redis chỉ là "loa phóng thanh" thông báo đồng thời cho tất cả instance.

### Bước 3 — Mỗi instance tự xử lý

Mỗi instance nhận message qua `subClient`, rồi thực hiện:

1. Deserialize payload
2. Lookup local state: "socket nào của tôi đang join `room:42`?"
3. Forward message đến đúng socket đó qua WebSocket connection thực sự

### Kết quả

```
Instance 2 emit "room:42"
  → pubClient.publish → Redis
  → Instance 1 subClient nhận → tìm socket trong room:42 → gửi cho Client A ✓
  → Instance 2 subClient nhận → tìm socket trong room:42 → gửi cho Client B ✓
  → Instance 3 subClient nhận → không có socket nào trong room:42 → bỏ qua
```

---

## Tại sao cần 2 Redis client riêng biệt?

```typescript
const pubClient = new Redis(process.env.REDIS_URL || '');
const subClient = pubClient.duplicate(); // KHÔNG dùng chung connection
```

Đây là **constraint của Redis protocol**, không phải design choice của Socket.IO.

Khi một Redis connection thực hiện lệnh `SUBSCRIBE`, connection đó bị **"khóa"** vào chế độ subscribe:

- Chỉ có thể nhận các lệnh: `SUBSCRIBE`, `UNSUBSCRIBE`, `PSUBSCRIBE`, `PUNSUBSCRIBE`, `PING`, `RESET`, `QUIT`
- **Không thể** chạy bất kỳ lệnh nào khác: `PUBLISH`, `SET`, `GET`, `DEL`...

Nếu dùng chung một connection cho cả publish và subscribe, lệnh `PUBLISH` sẽ trả về lỗi ngay sau khi connection đã subscribe.

`pubClient.duplicate()` tạo một connection **mới hoàn toàn** với cùng cấu hình (host, port, password, db) — không chia sẻ connection socket với `pubClient`.

---

## Setup theo thứ tự đúng

### Cách cũ — dùng `afterInit()` (LỖI)

```typescript
// ❌ SAI — afterInit() chạy quá sớm
@WebSocketGateway()
export class AppGateway implements AfterInit {
  @WebSocketServer() server: Server;

  afterInit() {
    this.server.adapter(...); // BOOM — this.server vẫn là undefined tại đây
  }
}
```

Thứ tự thực thi:

```
1. app.listen(3000)
2. NestJS tạo Socket.IO server
3. NestJS gọi afterInit()
       └─ this.server.adapter(...)  ← BOOM, this.server vẫn là undefined
4. NestJS mới gán @WebSocketServer() vào this.server  ← quá muộn
```

`afterInit()` được gọi ngay sau khi Gateway được khởi tạo, nhưng **trước khi** NestJS gán server instance vào `@WebSocketServer()`. Tại thời điểm đó `this.server` là `undefined`.

### Cách mới — override `createIOServer()` (ĐÚNG)

```typescript
// ✅ ĐÚNG — gắn adapter ngay lúc server được tạo
export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor); // adapterConstructor đã có giá trị
    return server;
  }
}
```

Thứ tự thực thi:

```
1. redisIoAdapter.connectToRedis()
       └─ adapterConstructor = createAdapter(pub, sub)  ← có giá trị
2. app.useWebSocketAdapter(redisIoAdapter)
       └─ NestJS biết "dùng class này để tạo server"
3. app.listen(3000)
       └─ NestJS gọi createIOServer()
             └─ super.createIOServer()   ← tạo Socket.IO server bình thường
             └─ server.adapter(...)      ← gắn Redis vào, adapterConstructor đã có
             └─ return server
4. NestJS gán server vào @WebSocketServer()  ← đúng thứ tự, không lỗi
```

`createIOServer()` là hook mà NestJS gọi để tạo server. Override hook này là điểm **duy nhất** có thể gắn adapter *trước khi server được trả về* cho bất kỳ ai. Đến lúc này `adapterConstructor` chắc chắn đã có giá trị vì `connectToRedis()` đã được await xong từ trước.

---

## Code đầy đủ

### `redis-io.adapter.ts`

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  /**
   * Khởi tạo kết nối Redis.
   * Tách riêng thành async method vì kết nối Redis là I/O operation — không thể await trong constructor.
   * main.ts gọi và await trước khi tiếp tục.
   */
  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(process.env.REDIS_URL || '');
    const subClient = pubClient.duplicate(); // connection riêng, cùng config
    this.adapterConstructor = createAdapter(pubClient, subClient);
    // adapterConstructor là factory function, chưa gắn vào server nào
  }

  /**
   * Override điểm then chốt: NestJS gọi method này khi tạo Socket.IO server.
   * Gắn adapter ngay tại đây — trước khi server được trả về cho bất kỳ ai.
   * Tại thời điểm này adapterConstructor đã có giá trị (connectToRedis đã chạy xong).
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

### `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisIoAdapter = new RedisIoAdapter(app);

  // Thứ tự 3 dòng này bắt buộc, không thể đảo ngược:
  await redisIoAdapter.connectToRedis();     // (1) build adapterConstructor
  app.useWebSocketAdapter(redisIoAdapter);   // (2) đăng ký với NestJS
  await app.listen(3000);                    // (3) trigger createIOServer()
}

bootstrap();
```

### Cài đặt dependencies

```bash
npm install @socket.io/redis-adapter ioredis
```

---

## Tại sao chọn Redis Pub/Sub, không phải cách khác?

### So sánh các giải pháp

| Giải pháp | Ưu điểm | Nhược điểm |
|---|---|---|
| **Redis Adapter** | Infrastructure sẵn có, official package, đơn giản | Fire-and-forget, không đảm bảo delivery |
| **Sticky Session** | Không cần thêm gì | Phụ thuộc load balancer, không scale tốt, single point of failure |
| **Kafka / RabbitMQ** | Guaranteed delivery, persistence | Phức tạp hơn, thêm hệ thống mới chỉ để sync socket events |
| **Redis Streams** | Guaranteed delivery, có persistence | Phức tạp hơn Redis pub/sub |

### Lý do chọn Redis Pub/Sub

**Stateless instances** — Mỗi instance hoàn toàn độc lập. Client có thể kết nối vào bất kỳ instance nào, không cần sticky session hay load balancer phức tạp.

**Tận dụng infrastructure sẵn có** — Redis hầu như đã được dùng cho cache, session, rate limiting. Không cần thêm message broker mới (Kafka, RabbitMQ) chỉ để sync socket events.

**Official package** — `@socket.io/redis-adapter` là package chính thức của Socket.IO team, xử lý đầy đủ edge cases: room management, namespace isolation, volatile emits, acknowledgements xuyên instance.

**Đơn giản** — Chỉ cần thêm ~20 dòng code, không thay đổi logic business.

### Hạn chế cần biết

Redis pub/sub là **fire-and-forget** — không đảm bảo delivery nếu instance bị down đúng lúc nhận message. Nếu cần guaranteed delivery, hãy xem xét Redis Streams hoặc message queue thực sự (RabbitMQ, Kafka).

---

## Tóm tắt

| Khái niệm | Giải thích |
|---|---|
| `pubClient` | Gửi message qua lệnh `PUBLISH` |
| `subClient` | Nhận message qua lệnh `SUBSCRIBE` — phải là connection riêng do Redis protocol constraint |
| `createIOServer()` | Hook override để gắn adapter ngay khi server được tạo |
| `connectToRedis()` | Async init riêng — phải được `await` trước `app.listen()` |
| Redis role | Message bus thuần túy — không giữ danh sách socket hay room |
| Local state | Mỗi instance tự quản lý socket/room của mình, Redis chỉ broadcast thông báo |