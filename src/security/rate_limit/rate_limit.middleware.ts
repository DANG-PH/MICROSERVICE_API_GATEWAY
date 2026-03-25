import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService, 
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    let identifier = 'anonymous';

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = this.jwtService.verify(token);
        identifier = `user:${payload.userId}`;
      } catch {
        identifier = `ip:${req.ip}`;
      }
    } else {
      identifier = `ip:${req.ip}`;
    }

    const key = `rate_limit:${identifier}`;
    const limit = 1000;
    const ttl = 60;

    let count = (await this.cacheManager.get<number>(key)) || 0;
    count++;

    if (count > limit) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, count, ttl * 1000);

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