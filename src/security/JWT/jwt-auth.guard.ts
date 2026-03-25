import { Injectable, Inject, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-1gio') {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = await super.canActivate(context);
    if (!ok) return false;

    const request = context.switchToHttp().getRequest();
    const { sessionId } = request.user;

    const session = await this.cacheManager.get(`session:${sessionId}`);
    if (!session) 
        throw new UnauthorizedException('Session hết hạn, vui lòng đăng nhập lại');

    return true; 
  }
}