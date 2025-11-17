import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { UserService } from './user.service';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import {UseItemAdminRequestDto,AddItemAdminRequestDto,UserDto,UpdateBalanceRequestDto,UseBalanceRequestDto,UseItemRequestDto,UserListResponseDto,UserResponseDto,UsernameRequestDto,GetUserRequestDto,EmptyDto,AddItemRequestDto,BalanceResponseDto,MessageResponseDto,RegisterRequestDto,SaveGameRequestDto,ItemListResponseDto,RegisterResponseDto,SaveGameResponseDto,AddBalanceRequestDto} from "dto/user.dto"
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';

@Controller('user')
@ApiTags('Api User') 
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản user, Sau khi auth đăng kí sẽ call cái này (BACKEND DEV)(SWAGGER) (ĐÃ DÙNG)' })
  @ApiBody({ type:  RegisterRequestDto })
  async register(@Body() body: RegisterRequestDto) {
    return this.userService.handleRegister(body);
  }

  // @Get('profile-admin/:id')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Lấy thông tin của 1 user bất kì dựa trên auth id của user đó (ADMIN)(WEB)' })
  // async profileadmin(@Param() param: UsernameRequestDto) {
  //   return this.userService.handleProfile(param);
  // }

  @Get('profile/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User xem profile của chính mình (USER)(GAME/WEB) (ĐÃ DÙNG)' })
  async profile(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.handleProfile({id: userId});
  }

  @Put('save-game')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User tự lưu thông tin của mình vào database (USER)(GAME) (ĐÃ DÙNG)' })
  @ApiBody({ type:  SaveGameRequestDto })
  async saveGame(@Body() body: SaveGameRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      user: {
        ...body.user,
        id: userId,
        auth_id: userId,
      }
    }
    return this.userService.handleSaveGame(request);
  }

  // @Get('balance-web-admin') //dùng @query vì có thể thêm điều kiện sau, còn @Param thì truy vấn nhất định mới nên dùng 
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Lấy thông tin vàng nạp từ web và ngọc nạp từ web của user (ADMIN)(WEB)' })
  // async getBalanceWebAdmin(@Query() query: UsernameRequestDto) {
  //   return this.userService.handleGetBalanceWeb(query);
  // }

  @Get('balance-web') 
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User lấy thông tin vàng nạp từ web và ngọc nạp từ web của bản thân (USER)(GAME/WEB) (ĐÃ DÙNG)' })
  async getBalanceWeb(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.handleGetBalanceWeb({id: userId});
  }

  @Patch('add-vang-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm vàng ( nạp trên web ) (USER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type:  AddBalanceRequestDto })
  async addVangWeb(@Body() body: AddBalanceRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleAddVangWeb(request);
  }

  @Patch('add-ngoc-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm ngọc ( nạp trên web ) (USER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type:  AddBalanceRequestDto })  
  async addNgocWeb(@Body() body: AddBalanceRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleAddNgocWeb(request);
  }

  @Patch('use-vang-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sử dụng vàng ( nạp trên web ) (USER)(GAME) (ĐÃ DÙNG)' })
  @ApiBody({ type:  UseBalanceRequestDto })
  async useVangWeb(@Body() body: UseBalanceRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleUseVangWeb(request);
  }

  @Patch('use-ngoc-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sử dụng ngọc ( nạp trên web ) (USER)(GAME) (ĐÃ DÙNG)' })
  @ApiBody({ type:  UseBalanceRequestDto })  
  async useNgocWeb(@Body() body: UseBalanceRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleUseNgocWeb(request);
  }

  // @Patch('update-balance')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Chọn loại tài nguyên ( vang/ngoc ) để thêm or giảm bớt của user (ADMIN)(WEB)' })
  // @ApiBody({ type:  UpdateBalanceRequestDto })  
  // async updateBalance(@Body() body: UpdateBalanceRequestDto) {
  //   return this.userService.handleUpdateBalance(body);
  // }

  // @Post('add-item-web-admin')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Add item web ( id đồ ) cho 1 user bất kì (ADMIN)(WEB)' })
  // @ApiBody({ type:  AddItemAdminRequestDto })  
  // async addItemWebAdmin(@Body() body: AddItemAdminRequestDto) {
  //   return this.userService.handleAddItemWeb(body);
  // }

  @Post('add-item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User add item web ( id đồ ) cho bản thân (USER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type:  AddItemRequestDto })  
  async addItemWeb(@Body() body: AddItemRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleAddItemWeb(request);
  }

  // @Delete('use-item-web-admin')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'sử dụng item web ( id đồ ) cho 1 user bất kì (ADMIN)(WEB)' })
  // @ApiBody({ type:  UseItemAdminRequestDto })  
  // async useItemWebAdmin(@Body() body: UseItemAdminRequestDto) {
  //   return this.userService.handleUseItemWeb(body);
  // }

  @Delete('use-item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User sử dụng item web ( id đồ ) cho bản thân (USER)(GAME) (ĐÃ DÙNG)' })
  @ApiBody({ type:  UseItemRequestDto })  
  async useItemWeb(@Body() body: UseItemRequestDto, @Req() req: any) {
    const userId = req.user.userId;
    const request = {
      ...body,
      id: userId
    }
    return this.userService.handleUseItemWeb(request);
  }

  // @Get('item-web-admin')
  // @ApiBearerAuth()
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'lấy item web của 1 user bất kì (ADMIN)(WEB)' })
  // async getItemWebAdmin(@Query() query: UsernameRequestDto) {
  //   return this.userService.handleGetItemWeb(query);
  // }

  @Get('item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User lấy item web của bản thân (USER)(GAME/WEB) (ĐÃ DÙNG)' })
  async getItemWeb(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.handleGetItemWeb(userId);
  }

  @Get('top10-suc-manh')
  @ApiOperation({ summary: 'Lấy top 10 user có sức mạnh cao nhất (ALL)(WEB) (ĐÃ DÙNG)' })
  async getTop10SucManh(@Query() query: EmptyDto) {
    return this.userService.handleGetTop10SucManh(query);
  }

  @Get('top10-vang')
  @ApiOperation({ summary: 'Lấy top 10 user có vàng cao nhất (ALL)(WEB) (ĐÃ DÙNG)' })
  async getTop10Vang(@Query() query: EmptyDto) {
    return this.userService.handleGetTop10Vang(query);
  }
}