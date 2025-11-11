import { Controller, Post, Body, UseGuards, Patch, Inject, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth } from '@nestjs/swagger';
import { 
    GetPayByUserIdRequestDto,
    PayResponseDto,
    UpdateMoneyRequestDto,
    UpdateStatusRequestDto,
    CreatePayOrderRequestDto,
    CreatePayRequestDto,
    QrResponseDto
 } from 'dto/pay.dto';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PayService } from './pay.service';

@Controller('pay')
@ApiTags('Api Pay') 
export class PayController {
  constructor(
    private readonly payService: PayService,
  ) {}

  @Get('pay')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin ví của user bất kì' })
  async getPay(@Query() query: GetPayByUserIdRequestDto): Promise<PayResponseDto> {
    return this.payService.getPay(query);
  }
  
  @Patch('money')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update thông tin ví của user bất kì ( tiền trong ví )' })
  @ApiBody({ type:  UpdateMoneyRequestDto })
  async updateMoney(@Body() body: UpdateMoneyRequestDto): Promise<PayResponseDto> {
    return this.payService.updateMoney(body);
  }

  @Patch('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update thông tin ví của user bất kì ( khóa / mở khóa ) ví' })
  @ApiBody({ type:  UpdateStatusRequestDto })
  async updateStatus(@Body() body: UpdateStatusRequestDto): Promise<PayResponseDto> {
    return this.payService.updateStatus(body);
  }

  @Post('create-pay')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo ví cho user bất kì' })
  @ApiBody({ type:  CreatePayRequestDto })
  async createPay(@Body() body: CreatePayRequestDto): Promise<PayResponseDto> {
    return this.payService.createPay(body);
  }

  @Get('qr')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin chuyển khoản ( mã QR )' })
  async getQr(@Query() query: CreatePayOrderRequestDto): Promise<QrResponseDto> {
    return this.payService.getQr(query);
  }
}