import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { OpenaiService } from './openai.service';
import { Controller, UseGuards, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

@Controller('user')
@ApiTags('Api User') 
export class UserController {
  constructor(private readonly openAIService: OpenaiService) {}

  @Get('ask') 
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User hỏi thông tin, AI trả lời (USER)(GAME/WEB) (CHƯA DÙNG)' })
  async ask(@Body() body: {tinNhan: string}) {
    if (!body.tinNhan) return "Không thể xử lí tin nhắn của bạn"
    return this.openAIService.chatCompletion(body.tinNhan);
  }
}