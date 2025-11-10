import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { RolesGuard } from 'src/security/guard/role.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { PartnerService } from './partner.service';
import {
  CreateAccountSellRequestDto,
  UpdateAccountSellRequestDto,
  DeleteAccountSellRequestDto,
  GetAccountsByPartnerRequestDto,
  GetAccountByIdRequestDto,
  UpdateAccountStatusRequestDto,
  EmptyDto,
  AccountResponseDto,
  ListAccountSellResponseDto,
} from 'dto/partner.dto';

@Controller('partner')
@ApiTags('Api Partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}
 
  @Post('create-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin đăng acc cần bán vào kho acc của hệ thống' })
  @ApiBody({ type: CreateAccountSellRequestDto })
  async createAccountSell(@Body() body: CreateAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleCreateAccountSell(body);
  }

  @Patch('update-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin cập nhật thông tin acc cần bán trong kho acc của hệ thống' })
  @ApiBody({ type: UpdateAccountSellRequestDto })
  async updateAccountSell(@Body() body: UpdateAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleUpdateAccountSell(body);
  }

  @Delete('delete-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin xóa acc cần bán trong kho acc của hệ thống' })
  @ApiBody({ type: DeleteAccountSellRequestDto })
  async deleteAccountSell(@Body() body: DeleteAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleDeleteAccountSell(body);
  }

  @Get('all-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User Xem tất cả acc cần bán ( status: ACTIVE ) trong kho acc của hệ thống' })
  async getAllAccountSell(@Query() query: EmptyDto): Promise<ListAccountSellResponseDto> {
    return this.partnerService.handleGetAllActiveAccounts(query);
  }

  @Get('account-sell-by-partner')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem tất cả acc cần bán ( status: ACTIVE ) của 1 partner/admin nhất định' })
  async getAccountsByPartner(@Query() query: GetAccountsByPartnerRequestDto): Promise<ListAccountSellResponseDto> {
    return this.partnerService.handleGetAccountsByPartner(query);
  }

  @Get('account-sell/:id')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem chi tiết một account nhất định theo id account' })
  async getAccountByIdr(@Param() param: GetAccountByIdRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleGetAccountById(param);
  }

  @Patch('mark-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Đánh dấu acc bất kì đã bán' })
  @ApiBody({ type: UpdateAccountStatusRequestDto })
  async markAccountAsSold(@Body() body: UpdateAccountStatusRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleMarkAccountAsSold(body);
  }
}
