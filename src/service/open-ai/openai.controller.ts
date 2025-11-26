import { JwtAuthGuard } from 'src/security/JWT/jwt-auth.guard';
import { OpenaiService } from './openai.service';
import { Controller, UseGuards, Get, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody,ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AskAiRequest } from 'dto/openai.dto';

@Controller('ai')
@ApiTags('Api Open AI') 
export class OpenAIController {
  constructor(private readonly openAIService: OpenaiService) {}

  @Post('ask') 
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User hỏi thông tin, AI trả lời (USER)(GAME/WEB) (CHƯA DÙNG)' })
  @ApiBody({ type:  AskAiRequest })
  async ask(@Body() body: AskAiRequest) {
    if (!body.tinNhan) return "Không thể xử lí tin nhắn của bạn"
    return this.openAIService.chatCompletion(body.tinNhan);
  }
  
}