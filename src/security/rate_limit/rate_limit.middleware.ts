import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip // tự parse ra socker.remoteAddress ( địa chỉ ip khi kết nối trực tiếp đến backend khi chưa thông qua cloudflare )
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

ví dụ thêm về req.ip và req.socket.remoteAddress và req.forward header 
Client (123.45.67.89) → Cloudflare (172.68.22.5) → Express
req.socket.remoteAddress → 172.68.22.5 (Cloudflare IP ❌)

IP thật người dùng là 123.45.67.89 ✅ — nhưng chỉ có trong header x-forwarded-for.
req.headers['x-forwarded-for'] -> nếu bật trust proxy thì nó sẽ gửi ve 2 ip ở client và cloud flare luôn

*/