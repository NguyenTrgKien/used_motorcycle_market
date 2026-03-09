import { PartialType } from '@nestjs/mapped-types';
import { CreateBlacklistTokenDto } from './create-blacklist_token.dto';

export class UpdateBlacklistTokenDto extends PartialType(CreateBlacklistTokenDto) {}
