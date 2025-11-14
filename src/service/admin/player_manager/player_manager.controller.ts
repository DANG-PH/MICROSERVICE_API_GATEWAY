import { Controller, UseGuards, Req, Get, Inject} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { CacheManagerStore } from 'cache-manager';
import type { RedisStore } from 'cache-manager-ioredis-yet';

@Controller('player_manager')
@ApiTags('Api Player Manager') 
export class PlayerManagerController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(CACHE_MANAGER) private cacheStore: CacheManagerStore,
  ) {}

  @Get('user-online-Ver1')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin/Player Manager xem user nào đang online (ADMIN)(WEB)' })
  async getOnlineUsersVer1(): Promise<any> {
    const value = await this.cacheManager.get('online_users')
    return {
      users: value
    }
  }

  @Get('user-online-Ver2')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin/Player Manager xem user nào đang online (ADMIN)(WEB)' })
  async getOnlineUsersVer2(): Promise<any> {
    // const store = this.cacheManager.stores[0];
  
    // // Lấy tất cả keys - truyền namespace (có thể là undefined hoặc '')
    // const allKeys: string[] = [];
    
    // if (store.iterator) {
    //   // Truyền namespace, dùng undefined để lấy tất cả
    //   for await (const [key] of store.iterator(undefined)) {
    //     allKeys.push(key);
    //   }
    // }
    
    // // Hoặc lấy cả values
    // const allData: Record<string, any> = {};
    // if (store.iterator) {
    //   for await (const [key, value] of store.iterator(undefined)) {
    //     allData[key] = value;
    //   }
    // }
    
    // return {
    //   keys: allKeys,
    //   data: allData
    // };

    const store = this.cacheManager.stores[0];
  
    const onlineUsers: string[] = [];  // Chỉ lưu username
    // const onlineUsersData: Record<string, any> = {};  // Lưu cả data
    
    if (store.iterator) {
      for await (const [key, value] of store.iterator(undefined)) {
        // Chỉ lấy keys bắt đầu với "online:"
        if (key.startsWith('online:')) {
          // Extract username từ "online:username" → "username"
          const username = key.replace('online:', '');
          
          onlineUsers.push(username);  // Thêm username vào array
          // onlineUsersData[username] = value;  // Lưu data (nếu cần)
        }
      }
    }
    
    return {
      total: onlineUsers.length,
      users: onlineUsers,  
    };
  }
}