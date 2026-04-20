# Circuit Breaker — Hướng Dẫn Toàn Diện

> Viết cho developer backend làm việc với microservices, đặc biệt NestJS + gRPC stack.

---

## Mục Lục

1. [Định nghĩa](#1-định-nghĩa)
2. [Tại sao cần Circuit Breaker](#2-tại-sao-cần-circuit-breaker)
3. [Ba trạng thái hoạt động](#3-ba-trạng-thái-hoạt-động)
4. [Khi nào nên dùng](#4-khi-nào-nên-dùng)
5. [Tác hại và rủi ro nếu dùng sai](#5-tác-hại-và-rủi-ro-nếu-dùng-sai)
6. [Implement trong NestJS + gRPC](#6-implement-trong-nestjs--grpc)
7. [Case thực tế: MMORPG Backend](#7-case-thực-tế-mmorpg-backend)
8. [Những gì được upgrade khi thêm CB](#8-những-gì-được-upgrade-khi-thêm-cb)
9. [Tips và best practices](#9-tips-và-best-practices)
10. [Các config quan trọng cần tuning](#10-các-config-quan-trọng-cần-tuning)

---

## 1. Định nghĩa

**Circuit Breaker** (CB) là một design pattern dùng để ngăn cascade failure trong hệ thống phân tán. Tên gọi lấy từ cầu dao điện — khi phát hiện quá tải, cầu dao tự ngắt để bảo vệ toàn bộ mạch.

Trong software, CB là một lớp proxy nằm giữa caller và callee. Nó theo dõi các lần gọi, đếm failure, và khi failure vượt ngưỡng thì **chủ động chặn** các request tiếp theo thay vì để chúng chờ timeout.

```
Không có CB:
  Caller ──────────────────────────────▶ [Service DOWN] → timeout 30s → fail

Có CB (sau khi OPEN):
  Caller ──▶ [CB] ──✂── reject ngay lập tức (< 1ms) → fail fast
```

CB không phải retry, không phải timeout — nó là **circuit protection** ở cấp độ pattern of failure theo thời gian.

---

## 2. Tại sao cần Circuit Breaker

### Vấn đề: Cascade Failure

Trong kiến trúc microservices, các service phụ thuộc nhau. Khi một service chết:

```
inventory-service chết
  → shop-service gọi inventory, chờ timeout 30s, thread bị block
  → 1000 request đồng thời = 1000 thread bị treo
  → shop-service hết thread pool
  → shop-service chết
  → gateway không gọi được shop-service
  → toàn bộ hệ thống down
```

Đây là **cascade failure** — một điểm lỗi lan rộng ra toàn bộ hệ thống.

### Vấn đề: Retry Storm

gRPC và HTTP client thường có built-in retry. Khi một service đang recover:

```
auth-service đang restart (cần 5s)
  → 500 client đồng thời retry mỗi 1s
  → auth-service nhận 500 * 5 = 2500 request trong lúc khởi động
  → auth-service không bao giờ recover được
```

CB giải quyết cả hai vấn đề bằng cách ngắt mạch sớm và cho service thời gian hồi phục.

---

## 3. Ba trạng thái hoạt động

```
                    failure count >= threshold
         ┌─────────────────────────────────────────┐
         │                                         ▼
      CLOSED                                     OPEN
    (bình thường)                           (đang ngắt mạch)
         ▲                                         │
         │                                         │ sau halfOpenAfter timeout
         │                                         ▼
         │                                     HALF-OPEN
         │                                  (thử 1 request)
         │                                         │
         └──────── success ────────────────────────┘
                                    │
                    failure ────────┘ (quay lại OPEN)
```

| State | Hành vi | Khi nào |
|---|---|---|
| **CLOSED** | Request đi qua bình thường, CB đếm failure | Mặc định |
| **OPEN** | Reject tất cả request ngay lập tức, không gọi service | Khi failure >= threshold |
| **HALF-OPEN** | Cho 1 request thử qua để kiểm tra recovery | Sau `halfOpenAfter` ms |

### Timeline ví dụ thực tế

```
t=0s    auth-service crash
t=1s    request 1 → fail (count: 1)
t=2s    request 2 → fail (count: 2)
t=3s    request 3 → fail (count: 3)
t=4s    request 4 → fail (count: 4)
t=5s    request 5 → fail (count: 5) → CB OPEN ⚡
t=5s~   mọi request bị reject ngay lập tức
t=15s   CB vào HALF-OPEN, thử 1 request
t=15s   → auth-service đã recover → CB CLOSED ✅
        → hoặc vẫn fail → CB OPEN thêm 10s nữa
```

---

## 4. Khi nào nên dùng

### Nên dùng CB khi:

- **Gọi external service** qua mạng (HTTP, gRPC, TCP) — bất kỳ I/O nào có thể fail
- **Service có SLA thấp** hoặc hay bị lỗi
- **Hệ thống có nhiều service phụ thuộc nhau** (microservices)
- **Saga / workflow** gọi nhiều service theo chuỗi
- **Real-time system** không thể chịu đựng latency spike từ timeout

### Không cần CB khi:

- Gọi internal function trong cùng process
- Query database local (dùng connection pool + retry thay thế)
- Operation idempotent và nhanh (< 5ms, không qua mạng)
- Batch job không có SLA real-time

---

## 5. Tác hại và rủi ro nếu dùng sai

CB không phải silver bullet. Dùng sai gây ra nhiều vấn đề hơn là giải quyết.

### 5.1 Threshold quá thấp → False positive

```typescript
// ❌ Nguy hiểm
breaker: new ConsecutiveBreaker(2) // 2 lần fail là OPEN
```

Chỉ cần 2 request fail do timeout mạng tạm thời → CB OPEN → toàn bộ traffic bị chặn dù service vẫn sống.

**Fix:** Threshold nên từ 5-10 consecutive failure, hoặc dùng percentage-based (>50% fail trong 60s).

### 5.2 halfOpenAfter quá ngắn → Không đủ thời gian recover

```typescript
// ❌ Nguy hiểm
halfOpenAfter: 1_000 // 1 giây
```

Service cần 30s để khởi động lại. CB thử mỗi 1s → nhận fail liên tục → không bao giờ CLOSED.

**Fix:** `halfOpenAfter` nên bằng hoặc lớn hơn thời gian khởi động trung bình của service.

### 5.3 Chỉ dùng 1 CB chung cho tất cả service

```typescript
// ❌ Sai
const globalBreaker = new CircuitBreaker(...)

// Dùng chung cho auth, inventory, shop...
globalBreaker.execute(() => authClient.validate(...))
globalBreaker.execute(() => inventoryClient.deduct(...))
```

`inventory-service` chết → globalBreaker OPEN → auth calls cũng bị chặn dù auth vẫn sống.

**Fix:** Mỗi downstream service có CB riêng (per-service breaker).

### 5.4 CB bọc quá cao (bọc cả saga)

```typescript
// ❌ Sai
breaker.execute(() => this.runEntireBuyAccountSaga())
```

1 trong 5 service fail → CB đếm → sau N lần toàn bộ saga bị chặn dù 4 service kia vẫn sống.

**Fix:** CB bọc ở từng client call riêng lẻ bên trong saga.

### 5.5 Không phân biệt lỗi 4xx vs 5xx

```typescript
// ❌ Sai — đếm cả lỗi business logic
const breaker = new CircuitBreaker(handleAll, ...)

// 1000 user nhập sai password → 1000 lần 401 → CB OPEN
// → không ai login được dù auth-service vẫn sống
```

**Fix:** Chỉ trip khi lỗi 5xx (server error), bỏ qua 4xx (client error).

```typescript
// ✅ Đúng
handleWhen(err => err instanceof HttpException && err.getStatus() >= 500)
```

---

## 6. Implement trong NestJS + gRPC

### 6.1 Cài đặt

```bash
npm install cockatiel
```

`cockatiel` là thư viện TypeScript thuần, nhẹ, type-safe, không dependency nặng.

### 6.2 CB Registry — Per-service, tự động

```typescript
// src/common/resilience/circuit-breaker.registry.ts
import {
  CircuitBreaker,
  ConsecutiveBreaker,
  handleWhen,
} from 'cockatiel';
import { HttpException } from '@nestjs/common';
import { winstonLogger } from 'src/logger/logger.config';

const breakerRegistry = new Map<string, CircuitBreaker>();

export function getBreakerFor(serviceName: string): CircuitBreaker {
  if (!breakerRegistry.has(serviceName)) {
    const breaker = new CircuitBreaker(
      // Chỉ trip khi lỗi server (>= 500), không trip với lỗi business (4xx)
      handleWhen(err => err instanceof HttpException && err.getStatus() >= 500),
      {
        halfOpenAfter: 10_000,             // Thử lại sau 10s
        breaker: new ConsecutiveBreaker(5), // 5 lần fail liên tiếp mới OPEN
      },
    );

    breaker.onStateChange(state => {
      const level = state === 'open' ? 'error' : 'info';
      winstonLogger[level]({
        message: `⚡ Circuit Breaker [${serviceName}] → ${state.toUpperCase()}`,
        service: serviceName,
      });

      // Hook vào Discord/Telegram alert
      if (state === 'open') {
        // alertService.sendDiscord(`🔴 CB OPEN: ${serviceName}`);
      }
    });

    breakerRegistry.set(serviceName, breaker);
  }

  return breakerRegistry.get(serviceName)!;
}

// Expose để health check endpoint đọc
export function getAllBreakerStates(): Record<string, string> {
  const result: Record<string, string> = {};
  breakerRegistry.forEach((breaker, name) => {
    result[name] = breaker.state;
  });
  return result;
}
```

### 6.3 Tích hợp vào grpcCall wrapper

```typescript
// src/common/grpc/grpc-call.util.ts
import { HttpException } from '@nestjs/common';
import { catchError, throwError } from 'rxjs';
import { status as grpcStatus } from '@grpc/grpc-js';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import { winstonLogger } from 'src/logger/logger.config';
import { getBreakerFor } from '../resilience/circuit-breaker.registry';

export function grpcToHttp(code: number | null): number {
  switch (code) {
    case grpcStatus.OK:                  return 200;
    case grpcStatus.INVALID_ARGUMENT:    return 400;
    case grpcStatus.NOT_FOUND:           return 404;
    case grpcStatus.ALREADY_EXISTS:      return 409;
    case grpcStatus.PERMISSION_DENIED:   return 403;
    case grpcStatus.RESOURCE_EXHAUSTED:  return 429;
    case grpcStatus.FAILED_PRECONDITION: return 400;
    case grpcStatus.UNAUTHENTICATED:     return 401;
    case grpcStatus.CANCELLED:           return 400;
    default:                             return 500;
  }
}

export function parseGrpcError(err: any) {
  if (err?.code !== undefined && err?.details) {
    return { code: err.code, message: err.details };
  }
  return { code: null, message: 'Unknown gRPC error' };
}

export async function grpcCall<T>(
  serviceName = 'UnknownService',
  obs: Observable<T>,
  useLastValue = false,
  metadata?: any,
): Promise<T> {
  const breaker = getBreakerFor(serviceName);

  const wrapped = obs.pipe(
    catchError(err => {
      const parsed = parseGrpcError(err);
      const httpStatus = grpcToHttp(parsed.code);
      const message = `🆘 Error → HTTP ${httpStatus}: ${parsed.message}`;

      if (httpStatus >= 500) {
        winstonLogger.error({
          message,
          service: serviceName,
          admin: process.env.ADMIN_TEST,
        });
      }

      return throwError(
        () => new HttpException(parsed.message ?? 'Internal error', httpStatus),
      );
    }),
  );

  // CB bọc ngoài cùng — transparent với caller
  return breaker.execute(() =>
    useLastValue ? lastValueFrom(wrapped) : firstValueFrom(wrapped),
  );
}
```

### 6.4 Health endpoint cho CB states

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { getAllBreakerStates } from 'src/common/resilience/circuit-breaker.registry';

@Controller('health')
export class HealthController {
  @Get('circuit-breakers')
  getCircuitBreakerStates() {
    return {
      timestamp: new Date().toISOString(),
      breakers: getAllBreakerStates(),
    };
  }
}

// Response example:
// {
//   "timestamp": "2024-01-15T10:30:00.000Z",
//   "breakers": {
//     "AuthService": "closed",
//     "InventoryService": "open",
//     "ShopService": "closed"
//   }
// }
```

---

## 7. Case thực tế: MMORPG Backend

### Kiến trúc hiện tại

```
Client
  │
  ▼
API Gateway (NestJS)
  ├── AuthModule       → auth-service (gRPC)
  ├── ShopModule       → shop-service (gRPC)
  ├── InventoryModule  → inventory-service (gRPC)
  ├── UserModule       → user-service (gRPC)
  └── ... 7 services khác
```

### Sau khi thêm CB

```
Client
  │
  ▼
API Gateway (NestJS)
  │
  └── grpcCall('AuthService', ...)       → [CB: AuthService]      → auth-service
  └── grpcCall('InventoryService', ...)  → [CB: InventoryService] → inventory-service
  └── grpcCall('ShopService', ...)       → [CB: ShopService]      → shop-service
  └── ...
```

Mỗi service có CB riêng, tự động tạo qua `getBreakerFor(serviceName)`.

### buyAccountSaga — CB đặt đúng chỗ

```typescript
// ✅ CB bọc từng step, không bọc cả saga
export class BuyAccountSaga {
  async execute(payload: BuyAccountDto) {
    // Step 1: Kiểm tra số dư
    const balance = await grpcCall(
      'InventoryService',                           // ← CB key
      this.inventoryClient.checkBalance(payload),
    );

    // Step 2: Trừ tiền
    await grpcCall(
      'InventoryService',
      this.inventoryClient.deductBalance(payload),
    );

    // Step 3: Đổi mật khẩu account
    await grpcCall(
      'AuthService',                                // ← CB riêng cho auth
      this.authClient.changePassword(payload),
    );

    // Step 4: Ghi log transaction
    await grpcCall(
      'LogService',
      this.logClient.recordTransaction(payload),
    );
  }
}
```

Nếu `AuthService` đang OPEN:
- Step 1, 2 (InventoryService) vẫn chạy bình thường
- Step 3 bị reject ngay lập tức, saga compensate đúng chỗ
- InventoryService không bị ảnh hưởng

### Scenario: auth-service bị down lúc 2AM

```
02:00:00  auth-service crash (OOM)
02:00:05  5 request fail liên tiếp → CB[AuthService] OPEN
02:00:05  Winston log: ERROR "⚡ Circuit Breaker [AuthService] → OPEN"
02:00:05  Discord webhook: 🔴 CB OPEN: AuthService
02:00:05  Mọi request cần auth bị reject ngay < 1ms, server vẫn sống
02:00:15  CB vào HALF-OPEN, thử 1 request
02:00:15  auth-service vẫn đang restart → fail → CB OPEN thêm 10s
02:00:25  CB HALF-OPEN lần 2
02:00:25  auth-service đã up → success → CB CLOSED ✅
02:00:25  Winston log: INFO "⚡ Circuit Breaker [AuthService] → CLOSED"
02:00:25  Discord webhook: 🟢 CB CLOSED: AuthService
```

Tổng thời gian downtime thực tế: 25s. Không có cascade failure.

---

## 8. Những gì được upgrade khi thêm CB

### 8.1 Reliability

- Hệ thống không bị cascade failure khi 1 service chết
- Server vẫn handle được các request không liên quan đến service đang lỗi

### 8.2 Observability

- `onStateChange` hook → có log và alert real-time khi có sự cố
- Health endpoint `/health/circuit-breakers` → biết ngay service nào đang OPEN
- Với hệ thống đang có Telegram + Discord alert: CB state changes tích hợp thẳng vào alert pipeline hiện có

### 8.3 Recovery tự động

- HALF-OPEN tự động test recovery → không cần deploy lại hay restart manual để "unlock"
- Service recover xong → CB tự CLOSED, traffic tự phục hồi

### 8.4 Portfolio value

Với MMORPG backend chạy 24/7 thực tế:
- Có thể nói "implemented circuit breaker pattern với per-service isolation"
- Có metrics cụ thể: số lần CB trip, MTTR (mean time to recovery)
- Là điểm khác biệt rõ ràng với junior developer thông thường

---

## 9. Tips và best practices

### 9.1 Đừng log khi CB đang OPEN — chỉ log khi state thay đổi

```typescript
// ❌ Sai — spam log
breaker.execute(...).catch(err => {
  logger.error('CB rejected') // log mỗi request bị reject → hàng ngàn log
})

// ✅ Đúng — chỉ log khi state thay đổi
breaker.onStateChange(state => {
  logger.warn(`CB [${serviceName}] → ${state}`)
})
```

### 9.2 Phân biệt lỗi có thể retry và không thể retry

```
Có thể retry (CB nên đếm):
  - Connection refused
  - 503 Service Unavailable
  - 504 Gateway Timeout
  - gRPC UNAVAILABLE, DEADLINE_EXCEEDED

Không nên retry (CB không đếm):
  - 400 Bad Request
  - 401 Unauthorized
  - 404 Not Found
  - gRPC INVALID_ARGUMENT, NOT_FOUND
```

### 9.3 CB + Retry — thứ tự đúng

```
Retry phải nằm BÊN TRONG CB, không phải bên ngoài:

✅ Đúng:
  CB.execute(() => retry(() => grpcCall(...)))

❌ Sai:
  retry(() => CB.execute(() => grpcCall(...)))
```

Nếu retry nằm ngoài CB: mỗi lần retry là 1 lần execute mới, CB sẽ đếm mỗi retry là 1 failure riêng lẻ — threshold đạt nhanh hơn dự kiến.

### 9.4 Đặt tên serviceName nhất quán

```typescript
// Dùng constant, không hardcode string
export const SERVICE_NAMES = {
  AUTH: 'AuthService',
  INVENTORY: 'InventoryService',
  SHOP: 'ShopService',
} as const;

// Dùng trong code
grpcCall(SERVICE_NAMES.AUTH, ...)
grpcCall(SERVICE_NAMES.INVENTORY, ...)
```

Tránh lỗi typo tạo ra 2 CB cho cùng 1 service (`'AuthService'` vs `'authService'`).

### 9.5 Fallback response khi CB OPEN

Đôi khi thay vì throw error, có thể trả về fallback:

```typescript
try {
  return await grpcCall('ShopService', this.shopClient.getItems(...));
} catch (err) {
  if (err instanceof BrokenCircuitError) {
    // CB đang OPEN → trả cache hoặc default
    return this.cacheService.getLastKnownItems();
  }
  throw err;
}
```

Phù hợp cho read operation (get items, get shop catalog). Không phù hợp cho write operation (buy, transfer).

### 9.6 Tune threshold dựa trên traffic thực tế

Không có con số "đúng" cho tất cả hệ thống. Nguyên tắc:

```
- threshold quá thấp (2-3): false positive khi mạng chập chờn
- threshold quá cao (50+): service đã chết 50 request rồi mới trip
- halfOpenAfter quá ngắn: service chưa kịp restart đã test
- halfOpenAfter quá dài: downtime kéo dài không cần thiết

Điểm bắt đầu tốt:
  consecutiveBreaker: 5
  halfOpenAfter: 10_000 (10s) — adjust theo restart time của service
```

---

## 10. Các config quan trọng cần tuning

| Config | Default recommend | Giải thích |
|---|---|---|
| `ConsecutiveBreaker(n)` | 5 | N lần fail liên tiếp mới OPEN |
| `halfOpenAfter` | 10_000ms | Thời gian chờ trước khi thử lại |
| `handleWhen` | `err.getStatus() >= 500` | Chỉ trip với server error |

### Nên monitor các metric sau

- **CB state changes per hour** — tần suất trip nói lên sức khỏe service
- **Duration in OPEN state** — thời gian downtime thực tế
- **Requests rejected by CB** — số request bị chặn khi CB OPEN
- **Recovery time** (từ OPEN → CLOSED) — MTTR của từng service

---

*Circuit Breaker không giải quyết lỗi — nó giới hạn damage khi lỗi xảy ra. Hệ thống tốt vẫn cần monitoring, alerting, và runbook để xử lý root cause.*