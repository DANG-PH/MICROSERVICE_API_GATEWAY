import { Module } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenaiService } from './openai.service';

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
})
export class OpenaiModule {}