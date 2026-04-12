# Buy Account — Kiến trúc & Thiết kế hệ thống

> **Mục đích tài liệu:** Giúp developer mới (hoặc reviewer) hiểu bài toán, lý do chọn mô hình, các pattern được áp dụng, và trade-off của từng lựa chọn trong flow mua tài khoản.

---

## 1. Bài toán đặt ra

Flow mua tài khoản cần thực hiện **nhiều thao tác trên nhiều service khác nhau** và đảm bảo tính toàn vẹn dữ liệu khi có lỗi xảy ra ở bất kỳ bước nào:

| Bước | Service | Thao tác |
|------|---------|----------|
| 1 | Auth Service | Đổi mật khẩu tài khoản |
| 2 | Auth Service | Đổi email tài khoản sang email người mua |
| 3 | Pay Service | Trừ tiền người mua |
| 4 | Pay Service | Cộng tiền cho người bán (98%) |
| 5 | Auth Service | Invalidate token version cũ |
| 6 | Partner DB | Cập nhật trạng thái tài khoản → `SOLD` |
| 7 | Auth Service | Gửi email xác nhận cho người mua |

**Các ràng buộc cứng:**

- Một tài khoản chỉ được bán **đúng một lần** — không được phép race condition giữa nhiều request đồng thời.
- Nếu bất kỳ bước nào thất bại, các bước đã thực hiện trước đó phải được **hoàn tác (compensate)**.
- Hệ thống phải **không mất đơn** dù server crash giữa chừng.
- Không được giữ database lock trong khi gọi network ra ngoài (tránh deadlock và giảm throughput).

---

## 2. Các cách tiếp cận & so sánh

### 2.1. Two-Phase Commit (2PC) — Distributed Transaction

**Ý tưởng:** Dùng một coordinator để đảm bảo tất cả service commit hoặc rollback đồng thời.

**Mức độ phổ biến:** Phổ biến trong hệ thống database truyền thống (Oracle RAC, MySQL Cluster), ít dùng trong microservices hiện đại.

| Ưu điểm | Nhược điểm |
|---------|-----------|
| ACID thật sự across services | Coordinator là single point of failure |
| Nhất quán mạnh (strong consistency) | Giữ lock trong suốt quá trình → latency cao |
| Đơn giản về mặt logic nghiệp vụ | Khó scale, không phù hợp với HTTP/gRPC services |
| | Không phải tất cả service đều hỗ trợ 2PC |

**Kết luận:** Không phù hợp — Pay Service và Auth Service là các gRPC service độc lập, không có giao thức 2PC chung.

---

### 2.2. Saga Pattern — Choreography (Event-driven)

**Ý tưởng:** Mỗi service tự lắng nghe event và phát event tiếp theo. Không có coordinator trung tâm.

**Mức độ phổ biến:** Phổ biến trong hệ thống event-driven thuần túy (Kafka-heavy architecture).

| Ưu điểm | Nhược điểm |
|---------|-----------|
| Decoupled hoàn toàn | Khó debug và trace flow |
| Scale tốt | Logic compensation phân tán, khó maintain |
| Không cần orchestrator | Dễ xảy ra vòng lặp event nếu thiết kế sai |

**Kết luận:** Phù hợp cho hệ thống lớn, nhưng với team nhỏ và flow tuyến tính, quản lý event phân tán sẽ phức tạp hơn cần thiết.

---

### 2.3. Saga Pattern — Orchestration (lựa chọn hiện tại)

**Ý tưởng:** Một orchestrator trung tâm (service này) chịu trách nhiệm điều phối toàn bộ các bước của saga, theo thứ tự, và thực hiện compensation nếu có lỗi.

**Mức độ phổ biến:** Rất phổ biến trong microservices (được dùng bởi Netflix, Uber, Amazon). Pattern chuẩn khi cần long-running transaction across services.

| Ưu điểm | Nhược điểm |
|---------|-----------|
| Dễ trace và debug — logic tập trung | Orchestrator có thể trở thành bottleneck |
| Compensation rõ ràng, có thứ tự | Cần cơ chế retry và idempotency thủ công |
| Phù hợp với team nhỏ/trung | Nếu orchestrator crash → cần cơ chế recovery |
| Không cần lock phân tán | Eventual consistency, không phải strong consistency |

---

### 2.4. Optimistic Locking

**Ý tưởng:** Thêm field `version` vào entity, mỗi lần update kiểm tra version có khớp không.

**Mức độ phổ biến:** Rất phổ biến trong các ứng dụng web thông thường (JPA `@Version`, Hibernate).

| Ưu điểm | Nhược điểm |
|---------|-----------|
| Không giữ lock → throughput cao | Conflict → phải retry ở tầng application |
| Đơn giản, không cần infrastructure | Không phù hợp cho tài nguyên tranh chấp cao |
| | Không đủ khi cần atomic multi-step saga |

**Kết luận:** Dùng bổ sung (trong `pollOutbox` để tránh double-pick), không dùng thay thế cho pessimistic lock trong bước claim tài khoản.

---

## 3. Mô hình được chọn: Local Transaction + Saga Orchestration + Outbox Pattern

### Tổng quan kiến trúc

```
Request
  │
  ▼
┌─────────────────────────────────────────────┐
│  PHASE 1: Claim & Outbox (1 transaction)    │
│                                             │
│  BEGIN TRANSACTION                          │
│    SELECT ... FOR UPDATE (pessimistic lock) │
│    UPDATE account SET status = 'PENDING'    │
│    INSERT INTO outbox_events (...)          │
│  COMMIT                                     │
└─────────────────────────────────────────────┘
         │
         │ eventEmitter.emit (realtime trigger)
         │ + Cron job (fallback recovery)
         ▼
┌─────────────────────────────────────────────┐
│  PHASE 2: Saga Execution                    │
│                                             │
│  Redis Lock (distributed, 5 min TTL)        │
│  Redis Idempotency Check                    │
│                                             │
│  Step 1: Change Password                    │
│  Step 2: Change Email                       │
│  Step 3: Deduct Buyer Balance               │
│  Step 4: Credit Partner Balance             │
│  Step 5: Invalidate Token                   │
│  Step 6: Mark account SOLD                  │
│  Step 7: Send confirmation email            │
│                                             │
│  On any failure → Compensate in reverse     │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  PHASE 3: Retry / Dead Letter               │
│                                             │
│  Exponential backoff: 30s → 2m → 10m       │
│  Max retries: 3                             │
│  After max retries → FAILED + alert         │
│  Stuck PROCESSING recovery: mỗi 30 giây    │
└─────────────────────────────────────────────┘
```

---

## 4. Các pattern được áp dụng

### 4.1. Pessimistic Locking (Local Transaction)

**Vị trí:** `buyAccountSaga()` — bên trong transaction.

**Mục đích:** Đảm bảo chỉ có **một request duy nhất** có thể claim tài khoản tại một thời điểm.

```
SELECT * FROM partner WHERE id = ? FOR UPDATE
↓
UPDATE status: ACTIVE → PENDING
↓
INSERT outbox_event
↓
COMMIT
```

**Tại sao cần:**
- Không có pessimistic lock → hai request đồng thời cùng thấy status `ACTIVE` → cùng mua thành công → tài khoản bị bán 2 lần.
- Lock chỉ được giữ trong thời gian ngắn (không có network call bên trong transaction).

**Lưu ý thiết kế:**
- Kiểm tra số dư (`payService.getPay`) được thực hiện **trước** transaction để tránh giữ lock trong khi gọi gRPC.
- Đây là "check-then-act" pattern: check sơ bộ ngoài transaction, act thật sự bên trong transaction với lock.

---

### 4.2. Outbox Pattern (Transactional Outbox)

**Vị trí:** `buyAccountSaga()` — ghi cùng transaction với việc claim tài khoản.

**Mục đích:** Đảm bảo **không mất event** dù server crash ngay sau khi commit.

**Vấn đề nếu không có Outbox:**

```
COMMIT transaction (account → PENDING)
↓
Server crash ← ở đây là mất event, saga không bao giờ chạy
↓
emit event
↓
Saga chạy
```

**Với Outbox:**

```
BEGIN TRANSACTION
  UPDATE account → PENDING
  INSERT outbox_event (status = PENDING)  ← ghi cùng transaction
COMMIT
↓
eventEmitter.emit (trigger ngay, fast path)
↓
Nếu crash: Cron job poll outbox → pick up và chạy lại
```

**Đảm bảo:** Nếu transaction commit thành công → chắc chắn có outbox row → chắc chắn saga sẽ được chạy (dù có retry).

---

### 4.3. Saga Orchestration với Compensation

**Vị trí:** `executeSagaSteps()`.

**Mục đích:** Thực thi các bước tuần tự và hoàn tác đúng các bước đã làm nếu có lỗi.

**Nguyên tắc compensation:**
- Track từng bước bằng boolean flag (`changePassDone`, `deductBuyerDone`...).
- Khi lỗi xảy ra ở bước N, chỉ compensate bước 1 đến N-1 (không compensate bước chưa thực hiện).
- Compensation chạy song song (`Promise.allSettled`) để giảm thời gian hoàn tác.
- Dùng `allSettled` thay vì `all` để đảm bảo **tất cả compensation đều được thử**, ngay cả khi một compensation thất bại.

```
Step 1: changePass ✓  → changePassDone = true
Step 2: changeEmail ✓ → changeEmailDone = true
Step 3: deductBuyer ✓ → deductBuyerDone = true
Step 4: creditPartner ✗ ← LỖI

Compensation (song song):
  deductBuyer → +accountPrice (hoàn tiền)
  changeEmail → email gốc
  changePass  → password gốc
```

**Known limitation (TODO trong code):**
- Các flag là in-memory state. Nếu saga crash và được cron job retry, các flag reset về `false` → các bước đã làm sẽ bị chạy lại.
- Cần thêm per-step idempotency key để tránh double-execution khi retry.

---

### 4.4. Idempotency (Redis)

**Vị trí:** `processOutboxEvent()`.

**Mục đích:** Đảm bảo **cùng một outbox event không bao giờ được xử lý thành công hai lần**, dù cron job hay event emitter trigger nhiều lần.

```
doneKey = saga:done:{event.id}

Nếu Redis có doneKey → skip (đã xử lý)
Nếu không → chạy saga → set doneKey với TTL 24h
```

**Lý do TTL 24h:** Sau 24h, nguy cơ duplicate xử lý gần như bằng 0 (outbox event đã ở trạng thái `DONE`).

---

### 4.5. Distributed Lock (Redis)

**Vị trí:** `processOutboxEvent()`.

**Mục đích:** Ngăn **nhiều worker/instance** xử lý cùng một outbox event đồng thời.

```
lockKey = saga:lock:{event.id}

SET lockKey 1 EX 300 NX
↓
Nếu acquired = null → worker khác đang xử lý → return
Nếu acquired = "OK"  → tiếp tục xử lý
```

**TTL 300s (5 phút):** Đủ lâu để saga hoàn thành. Nếu worker crash, lock tự giải phóng sau 5 phút → cron `recoverStuckProcessing` sẽ đặt lại outbox về `PENDING`.

---

### 4.6. Retry với Exponential Backoff

**Vị trí:** `handleSagaFailure()`.

**Mục đích:** Tự động retry khi lỗi tạm thời (network timeout, service tạm unavailable), tránh retry quá nhanh gây áp lực cho downstream.

| Lần retry | Delay |
|-----------|-------|
| 1 | 30 giây (`4^1 × 30s`) |
| 2 | 2 phút (`4^2 × 30s`) |
| 3 | 10 phút (`4^3 × 30s`) |
| Hết retry | Đánh `FAILED`, alert thủ công |

**Khi hết retry:**
- Outbox → `FAILED`
- Account → `ACTIVE` (hoàn trả cho người bán)
- Ghi log `CRITICAL` (TODO: gửi alert Slack/PagerDuty)

---

### 4.7. Stuck Recovery Cron

**Vị trí:** `recoverStuckProcessing()` — chạy mỗi 30 giây.

**Mục đích:** Phục hồi các outbox event bị kẹt ở `PROCESSING` quá 5 phút (do worker crash hoặc Redis lock hết hạn nhưng DB chưa update).

```
updatedAt < now - 5 phút AND status = PROCESSING
→ SET status = PENDING
→ Cron pollOutbox sẽ pick up và retry
```

---

## 5. Luồng dữ liệu trạng thái

### Outbox Event

```
PENDING → PROCESSING → DONE
              │
              └─→ PENDING (retry, backoff)
              └─→ FAILED  (hết retry)
```

### Account Status

```
ACTIVE
  │
  └─→ PENDING  (claim thành công)
        │
        ├─→ SOLD    (saga thành công)
        └─→ ACTIVE  (saga thất bại hết retry → compensation)
```

---

## 6. Tại sao không dùng Message Queue (RabbitMQ/Kafka)?

Codebase có comment `// Dùng tạm thay queue`. Đây là quyết định có chủ đích:

| Tiêu chí | EventEmitter + Outbox | Message Queue |
|---------|----------------------|---------------|
| Infrastructure | Không cần thêm | Cần broker riêng |
| At-least-once delivery | ✓ (qua outbox + cron) | ✓ (native) |
| Distributed consumers | Cần Redis lock thủ công | Native |
| Observability | Cần tự build | Native (dead letter, lag metrics) |
| Phù hợp khi | Traffic thấp-trung, team nhỏ | Traffic cao, nhiều consumer |

**Kết luận:** Với quy mô hiện tại, Outbox + EventEmitter đủ dùng và đơn giản hơn. Khi cần scale, thay `eventEmitter.emit` bằng publish lên queue, giữ nguyên outbox làm durability layer.

---

## 7. Điểm yếu & TODO

| Vấn đề | Mức độ | Ghi chú |
|--------|--------|---------|
| In-memory saga step flags | **Cao** | Nếu crash giữa saga và cron retry, các bước đã thực hiện có thể chạy lại. Cần per-step idempotency key lưu vào Redis hoặc DB |
| Compensation có thể fail | **Cao** | Hiện chỉ log `CRITICAL`. Cần alert thực sự (Slack, PagerDuty) và cơ chế DLQ cho compensation failures |
| Không có alert sau max retry | **Trung bình** | TODO đã ghi trong code |
| `nextRetryAt` không có index | **Thấp** | Nếu outbox table lớn, query trong `pollOutbox` sẽ chậm. Cần index trên `(status, nextRetryAt)` |
| Email gửi không có retry riêng | **Thấp** | Bước gửi email nằm sau SOLD, nếu fail không ảnh hưởng giao dịch nhưng user không nhận được email |

---

## 8. Checklist khi thay đổi flow

Khi sửa `executeSagaSteps`, cần đảm bảo:

- [ ] Mỗi bước mới thêm phải có **compensation tương ứng** trong khối `catch`.
- [ ] Compensation phải được thêm đúng thứ tự ngược lại.
- [ ] Nếu bước mới có thể gây side effect ngoài hệ thống (email, webhook...), cần xem xét idempotency riêng.
- [ ] Cập nhật tài liệu này nếu thay đổi số bước hoặc thứ tự.

---

*Tài liệu này mô tả trạng thái code tại thời điểm viết. Cập nhật khi có thay đổi kiến trúc.*