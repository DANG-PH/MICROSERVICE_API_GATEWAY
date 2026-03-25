import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import {UseItemAdminRequestDto,AddItemAdminRequestDto,UserDto,UpdateBalanceRequestDto,UseBalanceRequestDto,UseItemRequestDto,UserListResponseDto,UserResponseDto,UsernameRequestDto,GetUserRequestDto,EmptyDto,AddItemRequestDto,BalanceResponseDto,MessageResponseDto,RegisterRequestDto,SaveGameRequestDto,ItemListResponseDto,RegisterResponseDto,SaveGameResponseDto,AddBalanceRequestDto} from "dto/user.dto"
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { WsGateway } from './ws.gateway';

@Controller('game')
@ApiTags('Api Game') 
export class GameController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly wsGateway: WsGateway,
  ) {}

  @Post('play')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User vào chơi game sau khi verifyOTP và ở màn hình menu' })
  async play(@Req() req: any) {
    const { userId, sessionId } = req.user;

    const session = await this.cacheManager.get<Record<string, any>>(
        `session:${sessionId}`
    );
    if (!session) throw new UnauthorizedException('Session không hợp lệ');

    if (session.kicked) throw new UnauthorizedException('Session đã bị thu hồi');

    const currentSessionId = await this.cacheManager.get<string>(
        `user:${userId}:gameSession`
    );

    if (currentSessionId) {
        const socketId = await this.cacheManager.get<string>(
            `session:${currentSessionId}:ws`
        );

        // 1. kick WS nếu còn
        if (socketId) {
            await this.wsGateway.kickSocket(socketId);
        }

        // 2. lấy session cũ
        const oldSession = await this.cacheManager.get<Record<string, any>>(
            `session:${currentSessionId}`
        );

        // 3. đánh dấu kicked (QUAN TRỌNG)
        if (oldSession) {
            await this.cacheManager.set(
                `session:${currentSessionId}`,
                { ...oldSession, kicked: true },
                24 * 60 * 60 * 1000
            );
        }

        // 4. cleanup WS mapping (OK)
        await this.cacheManager.del(`session:${currentSessionId}:ws`);
    }

    await this.cacheManager.set(
        `user:${userId}:gameSession`,
        sessionId,
        24 * 60 * 60 * 1000,
    );

    await this.cacheManager.set(
        `session:${sessionId}`,
        { ...session, state: 'playing' },
        24 * 60 * 60 * 1000,
    );

    return { success: true };
  }
}