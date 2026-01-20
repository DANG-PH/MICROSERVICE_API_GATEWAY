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
      passReqToCallback: true, // bật để gọi đc validate() chứ req
    });
  }

  async validate(req: Request, payload: any) {
    const tokenFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    const platform = req.headers['x-platform'] || 'web';

    const accessTokenInRedis =
      await this.cacheManager.get(`ACCESS:${payload.username}:${platform}`);

    if (!accessTokenInRedis || accessTokenInRedis !== tokenFromHeader) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc bị thay đổi.');
    }

    return {userId: payload.userId, username: payload.username, role: payload.role }; 
  }
}