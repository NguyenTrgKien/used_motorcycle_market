import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionService } from './user_session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSession } from './entities/user_session.entity';

describe('UserSessionService', () => {
  let service: UserSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserSessionService>(UserSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
