import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserSessionDto } from './dto/create-user_session.dto';
import { UserSession } from './entities/user_session.entity';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { comparePass, hashPass } from 'src/utils/handlePassword';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepo: Repository<UserSession>,
  ) {}

  async create(
    userId: number,
    createUserSessionDto: CreateUserSessionDto,
  ): Promise<UserSession> {
    const refreshTokenHash = await hashPass(createUserSessionDto.refreshToken);
    const session: UserSession = this.userSessionRepo.create({
      refreshTokenHash,
      deviceName: createUserSessionDto.deviceName,
      browser: createUserSessionDto.browser,
      os: createUserSessionDto.os,
      ipAddress: createUserSessionDto.ipAddress,
      userAgent: createUserSessionDto.userAgent,
      expiredAt: createUserSessionDto.expiredAt,
      lastActive: new Date(),
      user: {
        id: userId,
      },
    });

    return await this.userSessionRepo.save(session);
  }

  async isActive(sessionId: number, userId: number) {
    const session = await this.userSessionRepo.findOne({
      where: {
        id: sessionId,
        user: {
          id: userId,
        },
        revokedAt: IsNull(),
        expiredAt: MoreThan(new Date()),
      },
    });

    return Boolean(session);
  }

  async findUserSessions(userId: number, refreshToken?: string | null) {
    const sessions = await this.userSessionRepo.find({
      where: {
        user: {
          id: userId,
        },
      },
      order: {
        lastActive: 'DESC',
        createdAt: 'DESC',
      },
    });

    return await Promise.all(
      sessions.map(async (session) => {
        const isCurrent = refreshToken
          ? await comparePass(refreshToken, session.refreshTokenHash)
          : false;
        return this.toResponse(session, isCurrent);
      }),
    );
  }

  async revoke(userId: number, sessionId: number) {
    const session = await this.userSessionRepo.findOne({
      where: {
        id: sessionId,
        user: {
          id: userId,
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Khong tim thay phien dang nhap');
    }

    if (!session.revokedAt) {
      await this.userSessionRepo.update(session.id, {
        revokedAt: new Date(),
      });
    }

    return {
      message: 'Da thu hoi phien dang nhap',
    };
  }

  async revokeByRefreshToken(refreshToken: string) {
    const sessions = await this.userSessionRepo.find({
      where: {
        revokedAt: IsNull(),
        expiredAt: MoreThan(new Date()),
      },
    });

    for (const session of sessions) {
      if (await comparePass(refreshToken, session.refreshTokenHash)) {
        await this.userSessionRepo.update(session.id, {
          revokedAt: new Date(),
        });
        return session;
      }
    }

    return null;
  }

  async revokeOtherSessions(userId: number, refreshToken?: string | null) {
    const sessions = await this.userSessionRepo.find({
      where: {
        user: {
          id: userId,
        },
        revokedAt: IsNull(),
      },
    });

    let revokedCount = 0;

    for (const session of sessions) {
      const isCurrent = refreshToken
        ? await comparePass(refreshToken, session.refreshTokenHash)
        : false;
      if (!isCurrent) {
        await this.userSessionRepo.update(session.id, {
          revokedAt: new Date(),
        });
        revokedCount += 1;
      }
    }

    return {
      message: 'Da thu hoi cac phien dang nhap khac',
      revokedCount,
    };
  }

  async revokeAllForUser(userId: number) {
    await this.userSessionRepo.update(
      {
        user: {
          id: userId,
        },
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  async refresh(refreshToken: string) {
    const sessions = await this.userSessionRepo.find({
      where: {
        revokedAt: IsNull(),
        expiredAt: MoreThan(new Date()),
      },
      relations: {
        user: true,
      },
    });

    for (const session of sessions) {
      if (await comparePass(refreshToken, session.refreshTokenHash)) {
        await this.touch(session.id);
        return session;
      }
    }

    throw new ForbiddenException(
      'Phien dang nhap khong hop le hoac da het han',
    );
  }

  async touch(sessionId: number) {
    await this.userSessionRepo.update(sessionId, {
      lastActive: new Date(),
    });
  }

  private toResponse(session: UserSession, isCurrent: boolean) {
    return {
      id: session.id,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiredAt: session.expiredAt,
      revokedAt: session.revokedAt,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      isActive: !session.revokedAt && session.expiredAt > new Date(),
      isCurrent,
    };
  }
}
