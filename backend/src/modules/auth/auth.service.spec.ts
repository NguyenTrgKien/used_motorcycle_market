import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BlacklistToken } from '../blacklist_token/entities/blacklist_token.entity';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { MailService } from '../mail/mail.service';
import { DataSource } from 'typeorm';
import { UserSessionService } from '../user_session/user_session.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(BlacklistToken),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserVerification),
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: UserSessionService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
