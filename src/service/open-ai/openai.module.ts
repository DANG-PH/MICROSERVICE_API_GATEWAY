import { Module } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenaiService } from './openai.service';
import { OpenAIController } from './openai.controller';

@Module({
  providers: [
    OpenaiService,
    {
      provide: String(process.env.OPENAI_CLIENT),
      useFactory: () => {
        return new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      },
    },
  ],
  exports: [OpenaiService],
  controllers: [OpenAIController],
})
export class OpenaiModule {}