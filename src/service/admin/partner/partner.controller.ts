import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,Query,Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { RolesGuard } from 'src/security/guard/role.guard';
import { Roles } from 'src/security/decorators/role.decorator';
import { Role } from 'src/enums/role.enum';
import { PartnerService } from './partner.service';
import {
  CreateAccountSellRequestDto,
  UpdateAccountSellRequestDto,
  DeleteAccountSellRequestDto,
  GetAccountByIdRequestDto,
  UpdateAccountStatusRequestDto,
  AccountResponseDto,
  ListAccountSellResponseDto,
  BuyAccountRequestDto,
  AccountInformationResponseDto,
  GetAllAccountByBuyerRequest,
  GetAllAccountByBuyerResponse,
  ListAccountSellRequestDto,
  PaginationRequestDto,
  PaginationByPartnerRequestDto,
  CreateAccountSellResponseDto,
  ConfirmAccountSellRequestDto,
  ConfirmAccountSellResponseDto
} from 'dto/partner.dto';
import type { Response as ResExpress } from 'express';
import { ERROR_PAGE, SUCCESS_PAGE } from 'src/template/confirmSell.template';

@Controller('partner')
@ApiTags('Api Partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}
 
  @Post('create-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin đăng acc cần bán vào kho acc của hệ thống (ADMIN/PARTNER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type: CreateAccountSellRequestDto })
  async createAccountSell(@Body() body: CreateAccountSellRequestDto, @Req() req: any): Promise<CreateAccountSellResponseDto> {
    const userId = req.user.userId;
    const username = req.user.username;
    const request = {
      ...body,
      partner_id: userId,
      partner_username: username
    }
    return this.partnerService.handleCreateAccountSell(request);
  }

  @Get('confirm-sell')
  @ApiOperation({ summary: 'Confirm đăng bán account qua email link' })
  async confirmSell(
    @Query('token') token: string,
    @Res() res: ResExpress
  ) {
    try {
      await this.partnerService.handleConfirmSell({ token });

      return res.send(this.renderHtml(true, 'Tài khoản của bạn đã được đăng bán.'));
    } catch (err: any) {
      return res.send(this.renderHtml(false, err.message || 'Link không hợp lệ hoặc đã hết hạn'));
    }
  }

  @Patch('update-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin cập nhật thông tin acc cần bán trong kho acc của hệ thống (ADMIN/PARTNER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type: UpdateAccountSellRequestDto })
  async updateAccountSell(@Body() body: UpdateAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleUpdateAccountSell(body);
  }

  @Delete('delete-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Partner/Admin xóa acc cần bán trong kho acc của hệ thống (ADMIN/PARTNER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type: DeleteAccountSellRequestDto })
  async deleteAccountSell(@Body() body: DeleteAccountSellRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleDeleteAccountSell(body);
  }

  @Get('all-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User Xem tất cả acc cần bán ( status: ACTIVE ) trong kho acc của hệ thống (ALL)(WEB) (ĐÃ DÙNG)' })
  async getAllAccountSell(@Query() query: PaginationRequestDto): Promise<ListAccountSellResponseDto> {
    return this.partnerService.handleGetAllActiveAccounts({
        paginationRequest: {
          page: query.page || "1",
          itemPerPage: query.itemPerPage || "10",
          search: query.search || ""
        }
    });
  }

  @Get('account-sell-by-partner')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem tất cả acc đang/đã bán của 1 partner/admin nhất định (ADMIN/PARTNER)(WEB) (ĐÃ DÙNG)' })
  async getAccountsByPartner(@Query() query: PaginationByPartnerRequestDto, @Req() req: any): Promise<ListAccountSellResponseDto> {
    const id = req.user.id;
    return this.partnerService.handleGetAccountsByPartner(
      {
        partner_id: id,
        paginationRequest: {
          page: query.page || "1",
          itemPerPage: query.itemPerPage || "10",
          search: query.search || ""
        }
      }
    );
  }

  @Get('account-sell/:id')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xem chi tiết một account nhất định theo id account (ALL)(WEB) (ĐÃ DÙNG)' })
  async getAccountByIdr(@Param() param: GetAccountByIdRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleGetAccountById(param);
  }

  @Patch('mark-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Đánh dấu acc bất kì đã bán (ADMIN/PARTNER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type: UpdateAccountStatusRequestDto })
  async markAccountAsSold(@Body() body: UpdateAccountStatusRequestDto): Promise<AccountResponseDto> {
    return this.partnerService.handleMarkAccountAsSold(body);
  }

  @Post('buy-account-sell')
  @ApiBearerAuth()
  @Roles(Role.PARTNER, Role.ADMIN, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User mua account trong kho tài khoản của hệ thống (USER)(WEB) (ĐÃ DÙNG)' })
  @ApiBody({ type: BuyAccountRequestDto })
  async buyAccount(@Body() body: BuyAccountRequestDto, @Req() req: any): Promise<AccountInformationResponseDto> {
    const userId = req.user.userId;
    const username = req.user.username;
    const request = {
      user_id: userId,
      username: username,
      ...body
    }
    return this.partnerService.handleBuyAccount(request);
  }
  
  @Get('all-account-buyer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User Xem tất cả acc mình đã mua trong kho acc của hệ thống (USER)(WEB) (ĐÃ DÙNG)' })
  async getAllAccountBuyer(@Query() query: GetAllAccountByBuyerRequest, @Req() req: any): Promise<GetAllAccountByBuyerResponse> {
    const userId = req.user.userId;
    const request = {
      ...query,
      buyer_id: userId
    }
    return this.partnerService.handleGetAllAccountBuyer(request);
  }

  public renderHtml(success: boolean, message: string) {
    return success ? SUCCESS_PAGE(message) : ERROR_PAGE(message);
  }
}
