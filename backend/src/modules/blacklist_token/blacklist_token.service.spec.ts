import { Test, TestingModule } from '@nestjs/testing';
import { BlacklistTokenService } from './blacklist_token.service';

describe('BlacklistTokenService', () => {
  let service: BlacklistTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlacklistTokenService],
    }).compile();

    service = module.get<BlacklistTokenService>(BlacklistTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
