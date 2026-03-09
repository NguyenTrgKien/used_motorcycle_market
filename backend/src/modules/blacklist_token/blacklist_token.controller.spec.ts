import { Test, TestingModule } from '@nestjs/testing';
import { BlacklistTokenController } from './blacklist_token.controller';
import { BlacklistTokenService } from './blacklist_token.service';

describe('BlacklistTokenController', () => {
  let controller: BlacklistTokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlacklistTokenController],
      providers: [BlacklistTokenService],
    }).compile();

    controller = module.get<BlacklistTokenController>(BlacklistTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
