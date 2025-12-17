import { Controller, UseGuards, Req, Get, Inject, Patch, Post, Body, Param, Query, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/security/guard/role.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AcceptFriendRequestDto, AcceptFriendResponseDto, AddFriendRequestDto, AddFriendResponseDto, BlockUserRequestDto, BlockUserResponseDto, GetAllFriendResponseDto, GetIncomingFriendResponseDto, GetSentFriendResponseDto, RejectFriendRequestDto, RejectFriendResponseDto, UnfriendRequestDto, UnfriendResponseDto } from 'dto/auth.dto';
import { AuthService } from 'src/service/auth/auth.service';

@Controller('social_network')
@ApiTags('Api Social network') 
export class SocialNetworkController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('add-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gửi lời mời kết bạn tới 1 User bất kì' })
  @ApiBody({ type: AddFriendRequestDto })
  async addFriend(@Body() body: AddFriendRequestDto, @Req() req: any): Promise<AddFriendResponseDto> {
    const request = {
      ...body,
      userId: req.user?.userId
    }
    return this.authService.handleAddFriend(request);
  }

  @Get('sent-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xem tất cả yêu cầu kết bạn mà bản thân đã gửi đi ( status pending )' })
  async sentFriend(@Req() req: any): Promise<GetSentFriendResponseDto> {
    const request = {
      userId: req.user?.userId
    }
    return this.authService.handleGetSendFriend(request)
  }

  @Get('incoming-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xem tất cả yêu cầu kết bạn mà bản thân nhận được từ người khác ( status pending )' })
  async incomingFriend(@Req() req: any): Promise<GetIncomingFriendResponseDto> {
    const request = {
      userId: req.user?.userId
    }
    return this.authService.handleGetIncomingFriend(request)
  }

  @Patch('accept-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chấp nhận lời mời kết bạn' })
  @ApiBody({ type: AcceptFriendRequestDto })
  async acceptFriend(@Body() body: AcceptFriendRequestDto): Promise<AcceptFriendResponseDto> {
    return this.authService.handleAcceptFriend(body);
  }

  @Delete('reject-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Từ chối lời mời kết bạn' })
  @ApiBody({ type: RejectFriendRequestDto })
  async rejectFriend(@Body() body: RejectFriendRequestDto): Promise<RejectFriendResponseDto> {
    return this.authService.handleRejectFriend(body);
  }

  @Get('all-friend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xem danh sách bạn bè của bản thân' })
  async allFriend(@Req() req: any): Promise<GetAllFriendResponseDto> {
    const request = {
      userId: req.user?.userId
    }
    return this.authService.handleGetAllFriend(request)
  }

  @Delete('unfriend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Hủy bạn bè ( nếu đã là bạn bè )' })
  @ApiBody({ type: UnfriendRequestDto })
  async unFriend(@Body() body: UnfriendRequestDto, @Req() req: any): Promise<UnfriendResponseDto> {
    const request = {
      ...body,
      userId: req.user?.userId
    }
    return this.authService.handleUnfriend(request);
  }

  @Patch('block-user')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chặn 1 user bất kì bất kể có đang là bạn bè hay không' })
  @ApiBody({ type: BlockUserRequestDto })
  async blockUser(@Body() body: BlockUserRequestDto, @Req() req: any): Promise<BlockUserResponseDto> {
    const request = {
      ...body,
      userId: req.user?.userId
    }
    return this.authService.handleBlockUser(request);
  }
}