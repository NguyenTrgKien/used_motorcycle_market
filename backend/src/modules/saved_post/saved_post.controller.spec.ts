import { Test, TestingModule } from '@nestjs/testing';
import { SavedPostController } from './saved_post.controller';
import { SavedPostService } from './saved_post.service';

describe('SavedPostController', () => {
  let controller: SavedPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedPostController],
      providers: [SavedPostService],
    }).compile();

    controller = module.get<SavedPostController>(SavedPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
