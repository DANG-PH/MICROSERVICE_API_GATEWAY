import { AcceptFriendResponse, FriendStatus } from 'proto/social-network.pb';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Length } from 'class-validator';
import { IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
// FriendShip

export class RelationFriendInfoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  relationId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  friendId: number;

  @ApiProperty({ example: 'Hải Đăng' })
  @IsString()
  @IsNotEmpty()
  friendRealname: string;

  @ApiProperty({ example: 'https://avatar' })
  @IsString()
  @IsNotEmpty()
  avatarUrl: string;

  @ApiProperty({ enum: FriendStatus, example: FriendStatus.PENDING })
  @IsEnum(FriendStatus)
  status: FriendStatus;

  @ApiProperty({ example: '2025-01-01T10:00:00Z' })
  @IsString()
  create_at: string;
}

export class FriendInfoDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  friendId: number;

  @ApiProperty({ example: 'Hải Đăng' })
  @IsString()
  @IsNotEmpty()
  friendRealname: string;

  @ApiProperty({ example: 'https://avatar' })
  @IsString()
  @IsNotEmpty()
  avatarUrl: string;

  @ApiProperty({ enum: FriendStatus, example: FriendStatus.ACCEPTED })
  @IsEnum(FriendStatus)
  status: FriendStatus;
}


export class AddFriendRequestDto {
  @ApiProperty({ example: 2, description: 'ID người muốn kết bạn' })
  @IsInt()
  friendId: number;
}

export class AddFriendResponseDto {
  @ApiProperty({ example: 10 })
  relationId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 2 })
  friendId: number;

  @ApiProperty({ enum: FriendStatus })
  status: FriendStatus;

  @ApiProperty({ example: '2025-01-01T10:00:00Z' })
  create_at: string;
}

export class GetSentFriendRequestDto {}

export class GetSentFriendResponseDto {
  @ApiProperty({ type: [RelationFriendInfoDto] })
  relationFriendInfo: RelationFriendInfoDto[];
}

export class GetIncomingFriendRequestDto {}

export class GetIncomingFriendResponseDto {
  @ApiProperty({ type: [RelationFriendInfoDto] })
  relationFriendInfo: RelationFriendInfoDto[];
}

export class AcceptFriendRequestDto {
  @ApiProperty({ example: 10, description: 'ID của quan hệ friend' })
  @IsInt()
  relationId: number;
}

export class AcceptFriendResponseDto {
  @ApiProperty({ type: RelationFriendInfoDto })  
  relationFriendInfo?: RelationFriendInfoDto;
}

export class RejectFriendRequestDto {
  @ApiProperty({ example: 10, description: 'ID của quan hệ friend' })
  @IsInt()
  relationId: number;
}

export class RejectFriendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class GetAllFriendRequestDto {}

export class GetAllFriendResponseDto {
  @ApiProperty({ type: [FriendInfoDto] })
  friendInfo: FriendInfoDto[];
}

export class UnfriendRequestDto {
  @ApiProperty({ example: 2, description: 'ID của người bạn cần xoá' })
  @IsInt()
  friendId: number;
}

export class UnfriendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class BlockUserRequestDto {
  @ApiProperty({ example: 2, description: 'ID của user cần block' })
  @IsInt()
  friendId: number;
}

export class BlockUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class CanChatRequestDto {
  @ApiProperty({ example: 2, description: 'ID của friend' })
  @IsInt()
  friendId: number;
}

export class CanChatResponseDto {
  @ApiProperty({ example: true })
  canChat: boolean;
}

export class MessageDto {
  @ApiProperty({ example: 'dm:1:2' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 2, description: 'ID của friend' })
  @IsInt()
  friendId: number;

  @ApiProperty({ example: 'Xin chào' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2025-01-01T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  create_at: string;
}

export class GetMessageRequestDto {
  @ApiProperty({ example: 'dm:1:2' })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class GetMessageResponseDto {
  @ApiProperty({ type: [MessageDto] })
  message: MessageDto[];
}

