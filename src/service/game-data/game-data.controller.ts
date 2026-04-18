import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { RolesGuard } from 'src/security/guard/role.guard';
import { GameDataService } from './game-data.service';
import {
  GetAllMapResponseDto,
  ThemMapRequestDto,
  SuaMapRequestDto,
  XoaMapRequestDto,
  MapBaseDto,
  GetAllNpcBaseResponseDto,
  ThemNpcBaseRequestDto,
  SuaNpcBaseRequestDto,
  XoaNpcBaseRequestDto,
  NpcBaseDto,
  GetNpcTheoMapRequestDto,
  GetNpcTheoMapResponseDto,
  ThemNpcSpawnRequestDto,
  SuaNpcSpawnRequestDto,
  XoaNpcSpawnRequestDto,
  NpcSpawnDto,
} from '../../../dto/game-data.dto';

@ApiTags('Api Game Data')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('game-data')
export class GameDataController {
  constructor(private readonly gameDataService: GameDataService) {}

  // ===== MAP BASE =====

  @Get('map')
  @ApiOperation({ summary: 'Lấy tất cả map (ADMIN)(WEB)' })
  async getAllMap(): Promise<GetAllMapResponseDto> {
    return this.gameDataService.handleGetAllMap();
  }

  @Post('map')
  @ApiOperation({ summary: 'Thêm map mới (ADMIN)(WEB)' })
  @ApiBody({ type: ThemMapRequestDto })
  async themMap(@Body() body: ThemMapRequestDto): Promise<MapBaseDto> {
    return this.gameDataService.handleThemMap(body);
  }

  @Patch('map')
  @ApiOperation({ summary: 'Sửa map (ADMIN)(WEB)' })
  @ApiBody({ type: SuaMapRequestDto })
  async suaMap(@Body() body: SuaMapRequestDto): Promise<MapBaseDto> {
    return this.gameDataService.handleSuaMap(body);
  }

  @Delete('map')
  @ApiOperation({ summary: 'Xóa map (ADMIN)(WEB)' })
  @ApiQuery({ name: 'id', type: Number })
  async xoaMap(@Query() query: XoaMapRequestDto): Promise<void> {
    await this.gameDataService.handleXoaMap(query);
  }

  @Get('map/npcs')
  @ApiOperation({ summary: 'Lấy danh sách NPC spawn theo map (ADMIN)(WEB)' })
  @ApiQuery({ name: 'map_id', type: Number })
  @UseGuards()
  async getNpcTheoMap(@Query() query: GetNpcTheoMapRequestDto): Promise<GetNpcTheoMapResponseDto> {
    return this.gameDataService.handleGetNpcTheoMap(query);
  }

  // ===== NPC BASE =====

  @Get('npc-base')
  @ApiOperation({ summary: 'Lấy tất cả NPC base (ADMIN)(WEB)' })
  async getAllNpcBase(): Promise<GetAllNpcBaseResponseDto> {
    return this.gameDataService.handleGetAllNpcBase();
  }

  @Post('npc-base')
  @ApiOperation({ summary: 'Thêm NPC base mới (ADMIN)(WEB)' })
  @ApiBody({ type: ThemNpcBaseRequestDto })
  async themNpcBase(@Body() body: ThemNpcBaseRequestDto): Promise<NpcBaseDto> {
    return this.gameDataService.handleThemNpcBase(body);
  }

  @Patch('npc-base')
  @ApiOperation({ summary: 'Sửa NPC base (ADMIN)(WEB)' })
  @ApiBody({ type: SuaNpcBaseRequestDto })
  async suaNpcBase(@Body() body: SuaNpcBaseRequestDto): Promise<NpcBaseDto> {
    return this.gameDataService.handleSuaNpcBase(body);
  }

  @Delete('npc-base')
  @ApiOperation({ summary: 'Xóa NPC base (ADMIN)(WEB)' })
  @ApiQuery({ name: 'id', type: Number })
  async xoaNpcBase(@Query() query: XoaNpcBaseRequestDto): Promise<void> {
    await this.gameDataService.handleXoaNpcBase(query);
  }

  // ===== NPC SPAWN =====

  @Post('npc-spawn')
  @ApiOperation({ summary: 'Thêm NPC spawn vào map (ADMIN)(WEB)' })
  @ApiBody({ type: ThemNpcSpawnRequestDto })
  async themNpcSpawn(@Body() body: ThemNpcSpawnRequestDto): Promise<NpcSpawnDto> {
    return this.gameDataService.handleThemNpcSpawn(body);
  }

  @Patch('npc-spawn')
  @ApiOperation({ summary: 'Sửa NPC spawn (ADMIN)(WEB)' })
  @ApiBody({ type: SuaNpcSpawnRequestDto })
  async suaNpcSpawn(@Body() body: SuaNpcSpawnRequestDto): Promise<NpcSpawnDto> {
    return this.gameDataService.handleSuaNpcSpawn(body);
  }

  @Delete('npc-spawn')
  @ApiOperation({ summary: 'Xóa NPC spawn (ADMIN)(WEB)' })
  @ApiQuery({ name: 'id', type: Number })
  async xoaNpcSpawn(@Query() query: XoaNpcSpawnRequestDto): Promise<void> {
    await this.gameDataService.handleXoaNpcSpawn(query);
  }
}