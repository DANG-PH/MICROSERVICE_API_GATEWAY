import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('cf-connecting-ip:', req.headers['cf-connecting-ip']);
    console.log('x-forwarded-for:', req.headers['x-forwarded-for']);
    console.log('req.ip:', req.ip);
    console.log('all headers:', req.headers);
    const ip = req.headers['cf-connecting-ip'] as string
            || req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
            || req.ip;// tự parse ra socker.remoteAddress ( địa chỉ ip khi kết nối trực tiếp đến backend khi chưa thông qua cloudflare )
    const key = `rate_limit_${ip}`;
    const limit = 1000; // Giới hạn 100 request
    const ttl = 60; // trong 60 giây

    let count = (await this.cacheManager.get<number>(key)) || 0;
    count++;

    if (count > limit) {
      throw new HttpException(
        'Bạn gửi quá nhiều request, vui lòng thử lại sau 1 phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, count, ttl * 1000); // TTL tính bằng mili giây
    next();
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
*/