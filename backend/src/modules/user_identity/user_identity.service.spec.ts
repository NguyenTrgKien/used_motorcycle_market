import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IdType, IdentityStatus, UserGender, UserStatus } from 'src/shared';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '../user/entities/user.entity';
import { UserIdentity } from './entities/user_identity.entity';
import { UserIdentityService } from './user_identity.service';
import { NotificationService } from '../notification/notification.service';

describe('UserIdentityService demo verification', () => {
  let service: UserIdentityService;
  let identityRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let cloudinary: Record<string, jest.Mock>;
  let queryBuilder: Record<string, jest.Mock>;
  let notificationService: Record<string, jest.Mock>;

  beforeEach(async () => {
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    identityRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn((value) => value),
    };
    userRepo = { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]) };
    cloudinary = {
      uploadSingleFile: jest.fn(),
      deleteFiles: jest.fn(),
    };
    notificationService = {
      createNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIdentityService,
        { provide: getRepositoryToken(UserIdentity), useValue: identityRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get<UserIdentityService>(UserIdentityService);
  });

  const data = {
    demoConsent: true,
    idNumber: '000123456789',
    idType: IdType.CCCD,
    fullName: 'Nguyễn Văn Demo',
    dateOfBirth: '1990-01-01',
    gender: UserGender.MALE,
    issueDate: '2020-01-01',
    issuePlace: 'Cục Demo',
    address: 'Địa chỉ mô phỏng',
  };

  const files = {
    idFront: [
      { mimetype: 'image/png', size: 100, buffer: Buffer.from('front') },
    ] as Express.Multer.File[],
    idBack: [
      { mimetype: 'image/png', size: 100, buffer: Buffer.from('back') },
    ] as Express.Multer.File[],
  };

  it('rejects a real-format CCCD number', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      status: UserStatus.ACTIVE,
      isVerified: true,
      phone: '+84521545654',
      phoneVerifiedAt: new Date(),
    });

    await expect(
      service.submit(1, { ...data, idNumber: '079123456789' }, files),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores a demo application without requiring a selfie', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      status: UserStatus.ACTIVE,
      isVerified: true,
      phone: '+84521545654',
      phoneVerifiedAt: new Date(),
    });
    queryBuilder.getOne.mockResolvedValue(null);
    identityRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 10, status: IdentityStatus.PENDING });
    cloudinary.uploadSingleFile
      .mockResolvedValueOnce({ url: 'front-url', publicId: 'front-id' })
      .mockResolvedValueOnce({ url: 'back-url', publicId: 'back-id' });

    await service.submit(1, data, files);

    expect(cloudinary.uploadSingleFile).toHaveBeenCalledTimes(2);
    expect(identityRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idFrontUrl: 'front-url',
        idBackUrl: 'back-url',
        selfieUrl: null,
      }),
    );
  });

  it('deletes verification images after approval', async () => {
    const identity = {
      id: 10,
      status: IdentityStatus.PENDING,
      idFrontUrl: 'front-url',
      idBackUrl: 'back-url',
      idFrontPublicId: 'front-id',
      idBackPublicId: 'back-id',
    } as UserIdentity;
    queryBuilder.getOne.mockResolvedValue(identity);

    await service.approve(10);

    expect(cloudinary.deleteFiles).toHaveBeenCalledWith([
      'front-id',
      'back-id',
    ]);
    expect(identity.status).toBe(IdentityStatus.APPROVED);
    expect(identity.idFrontUrl).toBeNull();
    expect(identity.idBackUrl).toBeNull();
  });

  it('updates a pending application without replacing its images', async () => {
    const identity = {
      id: 10,
      userId: 1,
      status: IdentityStatus.PENDING,
      idFrontUrl: 'front-url',
      idBackUrl: 'back-url',
      idFrontPublicId: 'front-id',
      idBackPublicId: 'back-id',
    } as UserIdentity;
    queryBuilder.getOne.mockResolvedValue(identity);
    identityRepo.findOne
      .mockResolvedValueOnce(identity)
      .mockResolvedValueOnce(identity);

    await service.update(1, { ...data, fullName: 'Nguyễn Demo Cập Nhật' }, {});

    expect(identityRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Nguyễn Demo Cập Nhật' }),
    );
    expect(cloudinary.uploadSingleFile).not.toHaveBeenCalled();
    expect(cloudinary.deleteFiles).not.toHaveBeenCalled();
  });

  it('rejects updates after an application starts processing', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 10,
      userId: 1,
      status: IdentityStatus.PROCESSING,
    });

    await expect(service.update(1, data, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns identity images for the owning user', async () => {
    queryBuilder.getOne.mockResolvedValue({
      idFrontUrl: 'front-url',
      idBackUrl: 'back-url',
    });

    await expect(service.getMineImages(1)).resolves.toEqual({
      data: {
        idFrontUrl: 'front-url',
        idBackUrl: 'back-url',
      },
    });
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'identity.userId = :userId',
      { userId: 1 },
    );
  });
});
