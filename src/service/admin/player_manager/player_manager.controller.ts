import { Controller, UseGuards, Req, Get, Inject, Patch, Post, Body, Param, Query, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthService } from 'src/service/auth/auth.service';
import { UserService } from 'src/service/user/user.service';
import { DeTuService } from 'src/service/detu/detu.service';
import { ItemService } from 'src/service/item/item.service';
import {UsernameRequestDto} from "dto/user.dto"
import {UserIdRequestDto } from "dto/item.dto"
import { GetDeTuRequestDto } from 'dto/detu.dto'
import { 
    GetPayByUserIdRequestDto,
    PayResponseDto,
 } from 'dto/pay.dto';
import { PayService } from 'src/service/pay/pay.service';

@Controller('player_manager')
@ApiTags('Api Player Manager') 
export class PlayerManagerController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private authService: AuthService,
    private userService: UserService,
    private deTuService: DeTuService,
    private itemService: ItemService,
    private payService: PayService
  ) {}

  @Get('user-online-Ver1')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin/Player Manager xem user nào đang online (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
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
  @ApiOperation({ summary: 'Admin/Player Manager xem user nào đang online (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG - VER2 NÀY CHÍNH XÁC HƠN VER1)' })
  async getOnlineUsersVer2(): Promise<any> {
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

  // Gọi sang user-service
  @Get('profile/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy thông tin của 1 user bất kì dựa trên auth id của user đó (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async profileadmin(@Param() param: UsernameRequestDto) {
    return this.userService.handleProfile(param);
  }

  @Get('balance-web') //dùng @query vì có thể thêm điều kiện sau, còn @Param thì truy vấn nhất định mới nên dùng 
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy thông tin vàng nạp từ web và ngọc nạp từ web của user (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async getBalanceWebAdmin(@Query() query: UsernameRequestDto) {
    return this.userService.handleGetBalanceWeb(query);
  }

  @Get('item-web')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'lấy item web của 1 user bất kì (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async getItemWebAdmin(@Query() query: UsernameRequestDto) {
    return this.userService.handleGetItemWeb(query);
  }
  
  // Gọi sang item-service
  @Get('user-items')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy tất cả thông tin item của 1 user bất kì (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async getUserItemAdmin(@Query() query: UserIdRequestDto) {
    return this.itemService.handleGetItemByUser(query);
  }

  // Gọi sang đệ tử service
  @Get('de-tu')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy đệ tử của user bất kì (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async getDeTuAdmin(@Query() query: GetDeTuRequestDto) {
    return this.deTuService.handleGetDeTu(query);
  }

  // Gọi sang pay-service
  @Get('pay')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy thông tin ví của user bất kì (ADMIN/PLAYER MANAGER)(WEB) (CHƯA DÙNG)' })
  async getPayAdmin(@Query() query: GetPayByUserIdRequestDto): Promise<PayResponseDto> {
    return this.payService.getPay(query);
  }
}