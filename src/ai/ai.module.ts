import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    AIService,
    OpenAIProvider,
    ClaudeProvider,
    GeminiProvider,
  ],
  exports: [AIService],
})
export class AiModule {}
