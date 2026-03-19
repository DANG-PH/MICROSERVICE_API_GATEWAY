import { Injectable, CanActivate, ExecutionContext, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class TemporaryBanGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;

    if (userId) {
      const ban = await this.cacheManager.get(`temporary-ban:${userId}`) as {
        admin: string;
        expireAt: string;
        why: string;
      };

      if (ban) {
        throw new HttpException(
          `Tài khoản đang bị khóa đến ${ban.expireAt}. Lý do: ${ban.why}, vui lòng liên hệ ADMIN ${ban.admin}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }
}