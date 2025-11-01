import { JwtAuthGuard } from 'src/JWT/jwt-auth.guard';
import { UserService } from './user.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/guard/role.guard';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
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

  @Post('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin của 1 user bất kì dựa trên auth id của user đó' })
  @ApiBody({ type:  GetUserRequestDto })
  async profile(@Body() body: GetUserRequestDto) {
    return this.userService.handleProfile(body);
  }

  @Post('save-game')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lưu thông tin của 1 user bất kì vào database' })
  @ApiBody({ type:  SaveGameRequestDto })
  async saveGame(@Body() body: SaveGameRequestDto) {
    return this.userService.handleSaveGame(body);
  }

  @Post('get-balance-web')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin vàng nạp từ web và ngọc nạp từ web của user' })
  @ApiBody({ type:  UsernameRequestDto })
  async getBalanceWeb(@Body() body: UsernameRequestDto) {
    return this.userService.handleGetBalanceWeb(body);
  }

}