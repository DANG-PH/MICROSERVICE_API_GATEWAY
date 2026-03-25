import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import {UseItemAdminRequestDto,AddItemAdminRequestDto,UserDto,UpdateBalanceRequestDto,UseBalanceRequestDto,UseItemRequestDto,UserListResponseDto,UserResponseDto,UsernameRequestDto,GetUserRequestDto,EmptyDto,AddItemRequestDto,BalanceResponseDto,MessageResponseDto,RegisterRequestDto,SaveGameRequestDto,ItemListResponseDto,RegisterResponseDto,SaveGameResponseDto,AddBalanceRequestDto} from "dto/user.dto"
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { WsGateway } from './ws.gateway';
import Redis from 'ioredis'; 

@Controller('game')
@ApiTags('Api Game') 
export class GameController {
  private redis: Redis;
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly wsGateway: WsGateway,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  @Post('play')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User vào chơi game sau khi verifyOTP và ở màn hình menu' })
  async play(@Req() req: any, @Body() body: { socketId?: string }) {
    const { userId, sessionId } = req.user;

    const session = await this.cacheManager.get<Record<string, any>>(
        `session:${sessionId}`
    );
    if (!session) throw new UnauthorizedException('Session không hợp lệ');
    if (session.kicked) throw new UnauthorizedException('Session đã bị thu hồi');

    // Atomic SET — trả về session cũ nếu có, đồng thời ghi session mới
    const luaScript = `
        local cur = redis.call('GET', KEYS[1])
        if cur == ARGV[1] then return cur end
        redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])
        return cur
    `;
    const oldSessionId = await this.redis.eval(
        luaScript,
        1,
        `user:${userId}:gameSession`,
        sessionId,
        String(24 * 60 * 60 * 1000),
    ) as string | null;

    if (oldSessionId) {
        const socketIdToKick = await this.cacheManager.get<string>(
            `session:${oldSessionId}:ws`
        );

        // Kick nếu tồn tại VÀ khác socket đang gọi /play
        if (socketIdToKick && socketIdToKick !== body.socketId) {
            await this.wsGateway.kickSocket(socketIdToKick);
        }
        await this.cacheManager.del(`session:${oldSessionId}:ws`);
    }

    await this.cacheManager.set(
        `session:${sessionId}`,
        { ...session, state: 'playing' },
        24 * 60 * 60 * 1000,
    );

    return { success: true };
  }
}