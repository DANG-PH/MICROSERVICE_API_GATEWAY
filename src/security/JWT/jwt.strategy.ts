import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-1gio') {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(req: Request, payload: any) {
    const sessionId = payload.sessionId;
    if (!payload.sessionId)
    throw new UnauthorizedException('Token không hợp lệ: thiếu sessionId');
    const session = await this.cacheManager.get(`session:${sessionId}`);
    if (!session) throw new UnauthorizedException('Session hết hạn, vui lòng đăng nhập lại');
    return {userId: payload.userId, username: payload.username, role: payload.role, platform: payload.platform, sessionId: payload.sessionId }; 
  }
}