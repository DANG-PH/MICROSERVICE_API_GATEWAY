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

    // 1. Lấy session hiện tại của user này (người đang chơi nếu có)
    const session = await this.cacheManager.get<Record<string, any>>(
        `session:${sessionId}`
    );
    if (!session) throw new UnauthorizedException('Session không hợp lệ');

    // 2. Check xem có session game khác đang chơi không
    const currentSessionId = await this.cacheManager.get<string>(
        `user:${userId}:gameSession`
    );

    console.log("Check xem có session game khác đang chơi: "+currentSessionId)

    if (currentSessionId && currentSessionId !== sessionId) {
        // 3. Kick session cũ
        const socketId = await this.cacheManager.get<string>(
        `session:${currentSessionId}:ws`
        );
        if (socketId) {
            await this.wsGateway.kickSocket(socketId);
        }
        await this.cacheManager.del(`session:${currentSessionId}`);
        await this.cacheManager.del(`session:${currentSessionId}:ws`);
        await this.cacheManager.del(`user:${userId}:gameSession`);

        console.log("PHAT HIEN ONLINE DONG THOI")
    }

    // 4. Gán session này là đang chơi
    await this.cacheManager.set(
        `user:${userId}:gameSession`,
        sessionId,
        24 * 60 * 60 * 1000,
    );

    const sessionGame = await this.cacheManager.get<string>(
        `user:${userId}:gameSession`
    );

    console.log("Session sau khi đã lưu: "+sessionGame)

    // 5. Update state => playing
    await this.cacheManager.set(
        `session:${sessionId}`,
        { ...session, state: 'playing' },
        24 * 60 * 60 * 1000,
    );

    return { success: true };
  }
}