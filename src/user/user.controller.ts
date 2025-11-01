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
}