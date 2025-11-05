import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { DeTuService } from './detu.service';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SaveGameDeTuRequestDto, SaveGameDeTuResponseDto, CreateDeTuRequestDto, CreateDeTuResponseDto, GetDeTuRequestDto, DeTuResponseDto} from 'dto/detu.dto'

@Controller('detu')
@ApiTags('Api Đệ Tử') 
export class DeTuController {
  constructor(private readonly deTuService: DeTuService) {}

  @Put('save-de-tu')
  @ApiOperation({ summary: 'Lưu thông tin đệ tử của user ( ghi đè toàn bộ ) ' })
  @ApiBody({ type: SaveGameDeTuRequestDto })
  async getUserItem(@Body() body: SaveGameDeTuRequestDto) {
    return this.deTuService.handleSaveDeTu(body);
  }

  @Post('create-de-tu')
  @ApiOperation({ summary: 'Tạo đệ tử cho 1 user bất kì ( tạm thời logic client chưa dùng tới )' })
  @ApiBody({ type: CreateDeTuRequestDto })
  async createDeTu(@Body() body: CreateDeTuRequestDto) {
    return this.deTuService.handleCreateDeTu(body);
  }

  @Get('de-tu')
  @ApiOperation({ summary: 'Lấy đệ tử của user bất kì' })
  async getDeTu(@Query() query: GetDeTuRequestDto) {
    return this.deTuService.handleGetDeTu(query);
  }
}