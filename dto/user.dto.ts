import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, Min, Max, IsBoolean, IsArray } from 'class-validator';

// ===== USER =====
export class UserDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  vang: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  ngoc: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  sucManh: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  vangNapTuWeb: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  ngocNapTuWeb: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  x: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  y: number;

  @ApiProperty({ example: 'Map1' })
  @IsString()
  mapHienTai: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  daVaoTaiKhoanLanDau: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  coDeTu: boolean;

  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  danhSachVatPhamWeb: number[];

  @ApiProperty({ example: 123 })
  @IsOptional()
  @IsInt()
  auth_id: number;
}

// ===== REGISTER =====
export class RegisterRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

// ===== GET PROFILE =====
export class GetUserRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;
}

export class UserResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;
}

// ===== SAVE GAME =====
export class SaveGameRequestDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ example: 50, description: 'Sức mạnh để tự' })
  @IsNumber()
  sucManhDeTu: number;
}

export class SaveGameResponseDto {
  @ApiProperty({ example: 'Lưu game thành công' })
  @IsString()
  message: string;
}

// ===== BALANCE =====
export class UsernameRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;
}

export class BalanceResponseDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  vangNapTuWeb: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  ngocNapTuWeb: number;
}

export class UseBalanceRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  amount: number;
}

export class UpdateBalanceRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'vang', description: 'vang | ngoc' })
  @IsString()
  type: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;
}

export class AddBalanceRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  amount: number;
}

// ===== USER LIST =====
export class UserListResponseDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];
}

// ===== ITEM =====
export class AddItemRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  itemId: number;
}

export class ItemListResponseDto {
  @ApiProperty({ example: [101, 102, 103] })
  @IsArray()
  @IsInt({ each: true })
  itemIds: number[];
}

export class UseItemRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  itemId: number;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Thao tác thành công' })
  @IsString()
  message: string;
}

// ===== EMPTY =====
export class EmptyDto {}
