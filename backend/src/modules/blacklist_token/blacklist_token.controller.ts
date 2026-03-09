import { Controller } from '@nestjs/common';
import { BlacklistTokenService } from './blacklist_token.service';

@Controller('blacklist-token')
export class BlacklistTokenController {
  constructor(private readonly blacklistTokenService: BlacklistTokenService) {}
}
