import { JwtAuthGuard } from 'src/JWT/jwt-auth.guard';
import { ItemService } from './item.service';
import { Controller, Post, Body, UseGuards, Param, Get, Patch, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import {ItemDto, UserIdRequestDto, ItemIdRequestDto, ItemResponseDto, ItemsResponseDto, AddItemRequestDto, AddMultipleItemsRequestDto, MessageResponseDto, EmptyDto} from "dto/item.dto"

@Controller('item')
@ApiTags('Api Item') 
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get('user-items')
  @ApiOperation({ summary: 'Lấy tất cả thông tin item của 1 user bất kì' })
  async getUserItem(@Query() query: UserIdRequestDto) {
    return this.itemService.handleGetItemByUser(query);
  }

  @Post('add-item')
  @ApiOperation({ summary: 'Thêm 1 item cho user bất kì' })
  @ApiBody({ type:  AddItemRequestDto })
  async addItem(@Body() body: AddItemRequestDto) {
    return this.itemService.handleAddItem(body);
  }

  @Put('update-item')
  @ApiOperation({ summary: 'Update thông tin của item bất kì ( có thể ghi đè toàn bộ )' })
  @ApiBody({ type:  ItemDto })
  async updateItem(@Body() body: ItemDto) {
    return this.itemService.handleUpdateItem(body);
  }

  @Delete('delete-item')
  @ApiOperation({ summary: 'Xóa item bất kì theo id của item đó' })
  @ApiBody({ type:  ItemIdRequestDto })
  async deleteItem(@Body() body: ItemIdRequestDto) {
    return this.itemService.handleDeleteItem(body);
  }

  @Post('add-items')
  @ApiOperation({ summary: 'Thêm nhiều item cho user bất kì' })
  @ApiBody({ type:  AddMultipleItemsRequestDto })
  async addItems(@Body() body: AddMultipleItemsRequestDto) {
    return this.itemService.handleAddMultiItem(body);
  }
}