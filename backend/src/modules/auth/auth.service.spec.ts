import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { BlacklistToken } from '../blacklist_token/entities/blacklist_token.entity';
import { UserVerification } from '../user_verification/entities/user_verification.entity';
import { MailService } from '../mail/mail.service';
import { UserSessionService } from '../user_session/user_session.service';
import { PhoneOtpDeliveryService } from './phone-otp-delivery.service';
import { VerificationType } from 'src/shared';
import { hashPass } from 'src/utils/handlePassword';

describe('AuthService phone verification', () => {
  let service: AuthService;
  let userService: Record<string, jest.Mock>;
  let verificationRepo: Record<string, jest.Mock>;
  let phoneDelivery: Record<string, jest.Mock>;
  let dataSource: Record<string, jest.Mock>;

  beforeEach(async () => {
    userService = {
      findUserById: jest.fn(),
      findUserByPhone: jest.fn(),
    };
    verificationRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };
    phoneDelivery = {
      ensureAvailable: jest.fn(),
      send: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: {} },
        { provide: getRepositoryToken(BlacklistToken), useValue: {} },
        {
          provide: getRepositoryToken(UserVerification),
          useValue: verificationRepo,
        },
        { provide: MailService, useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: UserSessionService, useValue: {} },
        { provide: PhoneOtpDeliveryService, useValue: phoneDelivery },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('creates an add-phone OTP for an account without a phone', async () => {
    userService.findUserById.mockResolvedValue({ id: 1, phone: null });
    userService.findUserByPhone.mockResolvedValue(null);
    verificationRepo.findOne.mockResolvedValue(null);
    verificationRepo.delete.mockResolvedValue({});
    verificationRepo.save.mockImplementation((value) => value);

    const result = await service.requestPhoneVerification(
      1,
      { phone: '0521545654', type: 'add_phone' },
      '127.0.0.1',
    );

    expect(result.type).toBe(VerificationType.ADD_PHONE);
    expect(phoneDelivery.send).toHaveBeenCalledWith(
      '+84521545654',
      expect.stringMatching(/^\d{6}$/),
    );
    expect(verificationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: VerificationType.ADD_PHONE,
        metadata: { newPhone: '+84521545654' },
      }),
    );
  });

  it('rejects a verification type that does not match the account state', async () => {
    userService.findUserById.mockResolvedValue({ id: 1, phone: null });

    await expect(
      service.requestPhoneVerification(1, {
        phone: '0521545654',
        type: 'change_phone',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates the phone and removes phone OTP records in one transaction', async () => {
    const record = {
      id: 10,
      type: VerificationType.ADD_PHONE,
      token: await hashPass('123456'),
      failedAttempts: 0,
      expiredAt: new Date(Date.now() + 60_000),
      metadata: { newPhone: '+84521545654' },
    } as UserVerification;
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(record),
      }),
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 1, phone: null })
        .mockResolvedValueOnce(null),
      update: jest.fn(),
      delete: jest.fn(),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.verifyPhoneVerification(1, {
      otp: '123456',
      type: 'add_phone',
    });

    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      1,
      expect.objectContaining({ phone: '+84521545654' }),
    );
    expect(manager.delete).toHaveBeenCalledWith(
      UserVerification,
      expect.objectContaining({ user: { id: 1 } }),
    );
  });

  it('persists a failed attempt before returning an invalid OTP error', async () => {
    const record = {
      id: 10,
      type: VerificationType.ADD_PHONE,
      token: await hashPass('123456'),
      failedAttempts: 0,
      expiredAt: new Date(Date.now() + 60_000),
      metadata: { newPhone: '+84521545654' },
    } as UserVerification;
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(record),
      }),
      update: jest.fn(),
      delete: jest.fn(),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.verifyPhoneVerification(1, {
        otp: '654321',
        type: 'add_phone',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.update).toHaveBeenCalledWith(UserVerification, 10, {
      failedAttempts: 1,
    });
  });
});
