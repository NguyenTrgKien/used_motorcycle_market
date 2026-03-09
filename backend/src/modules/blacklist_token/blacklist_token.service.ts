import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlacklistToken } from './entities/blacklist_token.entity';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BlacklistTokenService {
  constructor(
    @InjectRepository(BlacklistToken)
    private readonly blacklistTokenRepo: Repository<BlacklistToken>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearExpiredTokens() {
    await this.blacklistTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    console.log('Đã dọn dẹp token hết hạn!');
  }
}
