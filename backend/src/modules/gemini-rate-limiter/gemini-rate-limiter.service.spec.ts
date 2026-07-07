import { Test, TestingModule } from '@nestjs/testing';
import { GeminiRateLimiterService } from './services/gemini-rate-limiter.service';

describe('GeminiRateLimiterService', () => {
  let service: GeminiRateLimiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiRateLimiterService],
    }).compile();

    service = module.get<GeminiRateLimiterService>(GeminiRateLimiterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
