import { randomUUID } from 'crypto';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Controller, Post, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { WsGateway } from './ws.gateway';
import Redis from 'ioredis';

const PLAY_SCRIPT = `
  local key = KEYS[1]
  local newId = ARGV[1]
  local ttl = tonumber(ARGV[2])

  local oldId = redis.call('GETSET', key, newId)
  redis.call('EXPIRE', key, ttl)

  if oldId then
    local wsKey = 'gameSession:' .. oldId .. ':ws'
    local socketId = redis.call('GET', wsKey)
    redis.call('DEL', wsKey)
    return {oldId, socketId}
  end

  return {false, false}
`;

@Controller('game')
@ApiTags('Api Game')
export class GameController {
  private readonly redis: Redis;

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
  async play(@Req() req: any) {
    const { userId } = req.user;
    const gameSessionId = randomUUID();

    // Atomic: getset gameSession + expire + lấy socketId cũ + del ws key
    // Tất cả trong 1 round-trip Redis, không có race condition
    const [, socketId] = await this.redis.eval(
      PLAY_SCRIPT,
      1,
      `user:${userId}:gameSession`,
      gameSessionId,
      '86400',
    ) as [string | null, string | null];

    if (socketId) {
      await this.wsGateway.kickSocket(socketId);
    }

    return { success: true, gameSessionId };
  }
}