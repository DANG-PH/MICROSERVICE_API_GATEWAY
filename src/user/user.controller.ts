import { JwtAuthGuard } from 'src/JWT/jwt-auth.guard';
import { UserService } from './user.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/guard/role.guard';
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

  @Patch('save-game')
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
}