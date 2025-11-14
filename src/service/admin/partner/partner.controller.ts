import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,Query,Req } from '@nestjs/common';
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
  BuyAccountRequestDto,
  AccountInformationResponseDto,
  GetAllAccountByBuyerRequest,
  GetAllAccountByBuyerResponse
} from 'dto/partner.dto';

@Controller('partner')
@ApiTags('Api Partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}
 
  @Post('create-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin đăng acc cần bán vào kho acc của hệ thống (ADMIN/PARTNER)(WEB)' })
  @ApiBody({ type: CreateAccountSellRequestDto })
  async createAccountSell(@Body() body: CreateAccountSellRequestDto, @Req() req: any): Promise<AccountResponseDto> {
    const userId = req.user.userId;
    const request = {
      ...body,
      partner_id: userId
    }
    return this.partnerService.handleCreateAccountSell(request);
  }

  @Patch('update-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin cập nhật thông tin acc cần bán trong kho acc của hệ thống (ADMIN/PARTNER)(WEB)' })
  @ApiBody({ type: UpdateAccountSellRequestDto })
  async updateAccountSell(@Body() body: UpdateAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleUpdateAccountSell(body);
  }

  @Delete('delete-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin xóa acc cần bán trong kho acc của hệ thống (ADMIN/PARTNER)(WEB)' })
  @ApiBody({ type: DeleteAccountSellRequestDto })
  async deleteAccountSell(@Body() body: DeleteAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleDeleteAccountSell(body);
  }

  @Get('all-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User Xem tất cả acc cần bán ( status: ACTIVE ) trong kho acc của hệ thống (ALL)(WEB)' })
  async getAllAccountSell(@Query() query: EmptyDto): Promise<ListAccountSellResponseDto> {
    return this.partnerService.handleGetAllActiveAccounts(query);
  }

  @Get('account-sell-by-partner')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem tất cả acc đang/đã bán của 1 partner/admin nhất định (ADMIN/PARTNER)(WEB)' })
  async getAccountsByPartner(@Query() query: GetAccountsByPartnerRequestDto): Promise<ListAccountSellResponseDto> {
    return this.partnerService.handleGetAccountsByPartner(query);
  }

  @Get('account-sell/:id')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem chi tiết một account nhất định theo id account (ALL)(WEB)' })
  async getAccountByIdr(@Param() param: GetAccountByIdRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleGetAccountById(param);
  }

  @Patch('mark-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Đánh dấu acc bất kì đã bán (ADMIN/PARTNER)(WEB)' })
  @ApiBody({ type: UpdateAccountStatusRequestDto })
  async markAccountAsSold(@Body() body: UpdateAccountStatusRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleMarkAccountAsSold(body);
  }

  @Post('buy-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User mua account trong kho tài khoản của hệ thống (USER)(WEB)' })
  @ApiBody({ type: BuyAccountRequestDto })
  async buyAccount(@Body() body: BuyAccountRequestDto, @Req() req: any): Promise<AccountInformationResponseDto> {
    const userId = req.user.userId;
    const request = {
      user_id: userId,
      ...body
    }
    return this.partnerService.handleBuyAccount(request);
  }
  
  @Get('all-account-buyer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User Xem tất cả acc mình đã mua trong kho acc của hệ thống (USER)(WEB)' })
  async getAllAccountBuyer(@Query() query: GetAllAccountByBuyerRequest, @Req() req: any): Promise<GetAllAccountByBuyerResponse> {
    const userId = req.user.userId;
    const request = {
      ...query,
      buyer_id: userId
    }
    return this.partnerService.handleGetAllAccountBuyer(request);
  }
}
