import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { UserService } from './user.service';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import {UserDto,UpdateBalanceRequestDto,UseBalanceRequestDto,UseItemRequestDto,UserListResponseDto,UserResponseDto,UsernameRequestDto,GetUserRequestDto,EmptyDto,AddItemRequestDto,BalanceResponseDto,MessageResponseDto,RegisterRequestDto,SaveGameRequestDto,ItemListResponseDto,RegisterResponseDto,SaveGameResponseDto,AddBalanceRequestDto} from "dto/user.dto"

@Controller('user')
@ApiTags('Api User') 
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản user (qua gRPC, Sau khi auth đăng kí sẽ call cái này, "API này chỉ để test")' })
  @ApiBody({ type:  RegisterRequestDto })
  async register(@Body() body: RegisterRequestDto) {
    return this.userService.handleRegister(body);
  }

  @Get('profile/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin của 1 user bất kì dựa trên auth id của user đó' })
  async profile(@Param() param: UsernameRequestDto) {
    return this.userService.handleProfile(param);
  }

  @Put('save-game')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lưu thông tin của 1 user bất kì vào database' })
  @ApiBody({ type:  SaveGameRequestDto })
  async saveGame(@Body() body: SaveGameRequestDto) {
    return this.userService.handleSaveGame(body);
  }

  @Get('balance-web') //dùng @query vì có thể thêm điều kiện sau, còn @Param thì truy vấn nhất định mới nên dùng 
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin vàng nạp từ web và ngọc nạp từ web của user' })
  async getBalanceWeb(@Query() query: UsernameRequestDto) {
    return this.userService.handleGetBalanceWeb(query);
  }

  @Patch('add-vang-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm vàng ( nạp trên web ) của 1 user bất kì' })
  @ApiBody({ type:  AddBalanceRequestDto })
  async addVangWeb(@Body() body: AddBalanceRequestDto) {
    return this.userService.handleAddVangWeb(body);
  }

  @Patch('add-ngoc-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm ngọc ( nạp trên web ) của 1 user bất kì' })
  @ApiBody({ type:  AddBalanceRequestDto })  
  async addNgocWeb(@Body() body: AddBalanceRequestDto) {
    return this.userService.handleAddNgocWeb(body);
  }

  @Patch('use-vang-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sử dụng vàng ( nạp trên web ) của 1 user bất kì' })
  @ApiBody({ type:  UseBalanceRequestDto })
  async useVangWeb(@Body() body: UseBalanceRequestDto) {
    return this.userService.handleUseVangWeb(body);
  }

  @Patch('use-ngoc-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sử dụng ngọc ( nạp trên web ) của 1 user bất kì' })
  @ApiBody({ type:  UseBalanceRequestDto })  
  async useNgocWeb(@Body() body: UseBalanceRequestDto) {
    return this.userService.handleUseNgocWeb(body);
  }

  @Patch('update-balance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chọn loại tài nguyên ( vang/ngoc ) để thêm or giảm bớt của user' })
  @ApiBody({ type:  UpdateBalanceRequestDto })  
  async updateBalance(@Body() body: UpdateBalanceRequestDto) {
    return this.userService.handleUpdateBalance(body);
  }

  @Post('add-item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add item web ( id đồ ) cho 1 user bất kì' })
  @ApiBody({ type:  AddItemRequestDto })  
  async addItemWeb(@Body() body: AddItemRequestDto) {
    return this.userService.handleAddItemWeb(body);
  }

  @Delete('use-item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'sử dụng item web ( id đồ ) cho 1 user bất kì' })
  @ApiBody({ type:  UseItemRequestDto })  
  async useItemWeb(@Body() body: UseItemRequestDto) {
    return this.userService.handleUseItemWeb(body);
  }

  @Get('item-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'lấy item web của 1 user bất kì' })
  async getItemWeb(@Query() query: UsernameRequestDto) {
    return this.userService.handleGetItemWeb(query);
  }

  @Get('top10-suc-manh')
  @ApiOperation({ summary: 'Lấy top 10 user có sức mạnh cao nhất' })
  async getTop10SucManh(@Query() query: EmptyDto) {
    return this.userService.handleGetTop10SucManh(query);
  }

  @Get('top10-vang')
  @ApiOperation({ summary: 'Lấy top 10 user có vàng cao nhất' })
  async getTop10Vang(@Query() query: EmptyDto) {
    return this.userService.handleGetTop10Vang(query);
  }
}