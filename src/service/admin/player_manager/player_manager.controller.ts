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
import { PayService } from 'src/service/pay/pay/pay.service';
import { SendEmailToUserRequestDto, SendemailToUserResponseDto } from 'dto/auth.dto';
import { TemporaryBanRequestDto } from 'dto/player_manager.dto';

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

  // Gửi thông báo email cho user ( gọi sang auth )
  @Post('send-email')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ADMIN/PLAYER MANAGER gửi thông báo qua email cho user ( hoặc all ) ví dụ như ( bảo trì, cập nhật, ... ) (CHƯA DÙNG) ' })
  @ApiBody({ type:  SendEmailToUserRequestDto })
  async sendEmailToUser(@Body() body: SendEmailToUserRequestDto): Promise<SendemailToUserResponseDto> {
    return this.authService.handleSendEmailToUser(body);
  }

  @Post('temporary-ban')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ADMIN/PLAYER MANAGER khóa tài khoản tạm thời của 1 user ( max 3 ngày )' })
  @ApiBody({ type:  TemporaryBanRequestDto })
  async temporaryBan(@Body() body: TemporaryBanRequestDto, @Req() req: any) {
    const { userId, phut, why } = body;
    const usernameAdmin = req.user.username;
    const userIdAdmin = req.user.userId;
    
    if ( userId == userIdAdmin) {
      throw new HttpException(
        `Không thể ban chính mình`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (phut < 5 || phut > 4320) {
      throw new HttpException(
        `Thời gian ban phải từ 5 phút đến 3 ngày (4320 phút)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.handleProfile({id:userId});
    if (!user) {
      throw new HttpException(
        `User id ${userId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const now = Date.now();
    const timeHetHan = now + phut * 60 * 1000;

    const banData = {
      admin: usernameAdmin,
      why: why,
      startAt: new Date(now).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      expireAt: new Date(timeHetHan).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    }

    const currentBan = await this.cacheManager.get(`temporary-ban:${userId}`);
    if (currentBan) {
      await this.cacheManager.set(`temporary-ban:${userId}`, banData, phut * 60 * 1000);
      return {
        message: `Tài khoản có id ${userId} đang bị khóa. Đã cập nhật thành ${phut} phút.`,
        admin: usernameAdmin,
      };
    }

    await this.cacheManager.set(`temporary-ban:${userId}`, banData, phut * 60 * 1000);

    return {
      message: `Đã khóa tài khoản có id ${userId} trong ${phut} phút.`,
      admin: usernameAdmin,
    };
  }

  @Delete('temporary-ban/:userId')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ADMIN/PLAYER MANAGER mở khóa tài khoản nếu đang bị khóa tạm thời' })
  async unbanUser(@Param('userId') userId: number) {
    const current = await this.cacheManager.get(`temporary-ban:${userId}`);
    if (!current) {
      return { message: `User id ${userId} hiện không bị khóa` };
    }

    await this.cacheManager.del(`temporary-ban:${userId}`);
    return { message: `Đã mở khóa tài khoản user id ${userId}` };
  }

  @Get('temporary-ban-all')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PLAYER_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'ADMIN/PLAYER MANAGER xem danh sách user đang bị ban (tạm thời)' })
  async getAllTemporaryBannedUsers(): Promise<any> {
    const store = this.cacheManager.stores?.[0];

    console.log(store)

    const bans: Array<{
      userId: string,
      data: any
    }> = [];

    if (store?.iterator) {
      for await (const [key, value] of store.iterator(undefined)) {
        // Lọc các key bắt đầu bằng "temporary-ban:"
        if (key.startsWith('temporary-ban:')) {
          const userId = key.replace('temporary-ban:', '');
          bans.push({ userId, data: value });
        }
      }
    }

    return {
      total: bans.length,
      bans,
    };
  }
}