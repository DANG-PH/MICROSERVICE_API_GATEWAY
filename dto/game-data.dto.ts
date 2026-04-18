import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsString } from 'class-validator';
import { NpcSpawn } from 'proto/game-data.pb';

export enum LoaiNPC {
  NGUOI   = 'NGUOI',
  CAYDAU  = 'CAYDAU',
  RUONGDO = 'RUONGDO',
  DUIGA   = 'DUIGA',
}

// ===== MAP BASE =====

export class MapBaseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Nhà Gôhan' })
  @IsString()
  ten: string;
}

export class GetAllMapResponseDto {
  @ApiProperty({ type: () => [MapBaseDto] })
  maps: MapBaseDto[];
}

export class ThemMapRequestDto {
  @ApiProperty({ example: 'Nhà Gôhan', description: 'Tên map mới' })
  @IsString()
  ten: string;
}

export class SuaMapRequestDto {
  @ApiProperty({ example: 1, description: 'ID của map cần sửa' })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Đồi Hoa Cúc', description: 'Tên mới' })
  @IsString()
  ten: string;
}

export class XoaMapRequestDto {
  @ApiProperty({ example: 1, description: 'ID của map cần xóa' })
  @Type(() => Number)
  @IsInt()
  id: number;
}

// ===== NPC BASE =====

export class NpcBaseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'admin_haidang' })
  @IsString()
  ten: string;

  @ApiProperty({ example: LoaiNPC.NGUOI, enum: LoaiNPC })
  @IsEnum(LoaiNPC)
  loai: string;
}

export class GetAllNpcBaseResponseDto {
  @ApiProperty({ type: () => [NpcBaseDto] })
  npcs: NpcBaseDto[];
}

export class ThemNpcBaseRequestDto {
  @ApiProperty({ example: 'admin_haidang', description: 'Tên NPC mới' })
  @IsString()
  ten: string;

  @ApiProperty({ example: LoaiNPC.NGUOI, enum: LoaiNPC, description: 'Loại NPC' })
  @IsEnum(LoaiNPC)
  loai: string;
}

export class SuaNpcBaseRequestDto {
  @ApiProperty({ example: 1, description: 'ID của NPC base cần sửa' })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Thợ Săn', description: 'Tên mới' })
  @IsString()
  ten: string;

  @ApiProperty({ example: LoaiNPC.NGUOI, enum: LoaiNPC, description: 'Loại mới' })
  @IsEnum(LoaiNPC)
  loai: string;
}

export class XoaNpcBaseRequestDto {
  @ApiProperty({ example: 1, description: 'ID của NPC base cần xóa' })
  @Type(() => Number)
  @IsInt()
  id: number;
}

// ===== NPC SPAWN =====

export class NpcSpawnDto implements NpcSpawn {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  npc_base_id: number;

  @ApiProperty({ example: 'admin_haidang' })
  @IsString()
  ten_npc: string;

  @ApiProperty({ example: LoaiNPC.NGUOI, enum: LoaiNPC })
  @IsEnum(LoaiNPC)
  loai_npc: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  map_id: number;

  @ApiProperty({ example: 'Nhà Gôhan' })
  @IsString()
  ten_map: string;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 7.3 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}

export class GetNpcTheoMapRequestDto {
  @ApiProperty({ example: 1, description: 'ID của map cần lấy danh sách NPC' })
  @Type(() => Number)
  @IsInt()
  map_id: number;
}

export class GetNpcTheoMapResponseDto {
  @ApiProperty({ type: () => [NpcSpawnDto] })
  npcs: NpcSpawnDto[];
}

export class ThemNpcSpawnRequestDto {
  @ApiProperty({ example: 2, description: 'ID của NPC base' })
  @IsInt()
  npc_base_id: number;

  @ApiProperty({ example: 1, description: 'ID của map' })
  @IsInt()
  map_id: number;

  @ApiProperty({ example: 12.5, description: 'Tọa độ X' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 7.3, description: 'Tọa độ Y' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: true, description: 'Trạng thái active' })
  @IsBoolean()
  is_active: boolean;
}

export class SuaNpcSpawnRequestDto {
  @ApiProperty({ example: 1, description: 'ID của NPC spawn cần sửa' })
  @IsInt()
  id: number;

  @ApiProperty({ example: 1, description: 'ID map mới (nếu muốn chuyển map)' })
  @IsInt()
  map_id: number;

  @ApiProperty({ example: 15.0, description: 'Tọa độ X mới' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 9.1, description: 'Tọa độ Y mới' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: false, description: 'Trạng thái active mới' })
  @IsBoolean()
  is_active: boolean;
}

export class XoaNpcSpawnRequestDto {
  @ApiProperty({ example: 1, description: 'ID của NPC spawn cần xóa' })
  @Type(() => Number)
  @IsInt()
  id: number;
}