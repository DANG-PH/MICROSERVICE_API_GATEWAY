import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    let identifier: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        identifier = `user:${payload.userId}`;
      } catch {
        // JWT invalid — fallthrough to null
      }
    }

    // TODO: Anonymous rate limiting bị vô nghĩa ở case Vercel SSR vì
    // cf-connecting-ip / x-forwarded-for đều trả về IP Vercel server thay vì IP browser thật.
    // Cần FE gửi kèm header `x-browser-ip` (đọc từ Vercel middleware) hoặc dùng
    // anonymous session token (`x-anonymous-id`) thì mới xử lý tiếp được.
    // Tạm thời: bỏ qua request không xác định được userId.
    if (!identifier) {
      return next();
    }

    // await this.checkRateLimit(identifier);
    next();
  }

  private async checkRateLimit(identifier: string): Promise<void> {
    const WINDOW_SIZE = 60;  // seconds
    const LIMIT = 100;       // max requests per window

    const now = Math.floor(Date.now() / 1000); // lấy ra giây
    const currentWindow = Math.floor(now / WINDOW_SIZE); // lấy ra phút
    const prevWindow = currentWindow - 1; // prev 1 phút trước

    const currentKey = `rl:swc:${identifier}:${currentWindow}`;
    const prevKey    = `rl:swc:${identifier}:${prevWindow}`;

    // Đọc song song 2 counters, không block nhau
    const [prevCountStr, currentCountStr] = await Promise.all([
      this.redis.get(prevKey),
      this.redis.get(currentKey),
    ]);

    const prevCount    = parseInt(prevCountStr    || '0', 10); // Hệ thập phân 
    const currentCount = parseInt(currentCountStr || '0', 10);

    // Tính trọng số: bao nhiêu % của window trước còn nằm trong 60s gần nhất
    const elapsedInCurrentWindow = now % WINDOW_SIZE; // lấy ra số giây còn thừa 
    const prevWeight = 1 - elapsedInCurrentWindow / WINDOW_SIZE;
    // Công thức: count req = count trong window hiện tại + số count window cũ * mức độ ảnh hưởng 
    // Mức độ ảnh hưởng count của window cũ sẽ giảm theo thời gian khi thời gian của window mới sắp hết
    // Tức là sao: khi mới qua window mới, thì mức độ ảnh hưởng window cũ xấp xỉ 1 còn khi sắp chuẩn bị qua giai đoạn window kế tiếp mức độ ảnh hưởng win cũ gần như bằng 0
    // Sliding window mượt mà, gần giống nội suy tuyến tính count_mới + count_cũ * (1-t) 
    const estimate   = currentCount + prevCount * prevWeight;

    if (estimate >= LIMIT) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please slow down.',
          retryAfter: WINDOW_SIZE - elapsedInCurrentWindow,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Tăng counter hiện tại (atomic INCR) + set TTL
    const pipeline = this.redis.pipeline();
    pipeline.incr(currentKey);
    pipeline.expire(currentKey, WINDOW_SIZE * 2); // *2 để key không expire giữa chừng
    await pipeline.exec();
  }
}

/*
  Lấy IP thật của client qua 3 lớp fallback:

  TRƯỜNG HỢP 1: Request đi qua Cloudflare (production)
  Client (1.2.3.4) → Cloudflare (172.68.x.x) → Nginx → NestJS
  - req.socket.remoteAddress = 172.68.x.x  (IP Cloudflare ❌)
  - req.headers['x-forwarded-for'] = "1.2.3.4, 172.68.x.x"
  - req.headers['cf-connecting-ip'] = "1.2.3.4" ✅
  → Dùng cf-connecting-ip, do Cloudflare tự thêm, client không giả được

  TRƯỜNG HỢP 2: Request đi qua Nginx nhưng không qua Cloudflare (gọi thẳng IP)
  Client (1.2.3.4) → Nginx → NestJS
  - req.headers['cf-connecting-ip'] = undefined (không có Cloudflare ❌)
  - req.headers['x-forwarded-for'] = "1.2.3.4" ✅ (do nginx set proxy_set_header X-Forwarded-For)
  - split(',')[0].trim() để lấy IP đầu tiên phòng trường hợp có nhiều proxy
  → Dùng x-forwarded-for

  TRƯỜNG HỢP 3: Gọi thẳng vào NestJS không qua Nginx (local dev / test)
  Client (1.2.3.4) → NestJS
  - req.headers['cf-connecting-ip'] = undefined ❌
  - req.headers['x-forwarded-for'] = undefined ❌
  - req.ip = "1.2.3.4" ✅ (Express tự parse từ socket.remoteAddress)
  → Dùng req.ip

  TRƯỜNG HỢP 4: FE deploy Vercel SSR → gọi sang backend (hiện tại)
  Browser (1.2.3.4) → Vercel server (3.236.118.101) → Cloudflare → Nginx → NestJS
  - req.headers['cf-connecting-ip'] = "3.236.118.101" ❌ (IP Vercel server, không phải browser)
  - req.headers['x-forwarded-for'] = "3.236.118.101, 162.158.78.159" ❌ (vẫn là Vercel + Cloudflare)
  - IP browser thật bị mất hoàn toàn ở bước Vercel, backend không bao giờ nhìn thấy
  → Rate limit theo IP vô nghĩa, phải dùng userId
  → Cách khắc phục:
     A. Tắt SSR Vercel — dùng Static Export, browser gọi thẳng vào backend
        next.config.js: output: 'export'  (chỉ dùng được nếu không cần SSR/API routes)
     B. Deploy FE lên VPS — browser → Cloudflare → Nginx → NestJS, cf-connecting-ip là IP thật
     C. Giữ Vercel SSR nhưng rate limit theo userId thay vì IP
*/