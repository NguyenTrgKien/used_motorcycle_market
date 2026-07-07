import { Module } from '@nestjs/common';
import { GeminiRateLimiterService } from './services/gemini-rate-limiter.service';
import { GeminiVisionService } from './services/gemini-vision.service';

@Module({
  providers: [GeminiRateLimiterService, GeminiVisionService],
  exports: [GeminiRateLimiterService, GeminiVisionService],
})
export class GeminiRateLimiterModule {}
