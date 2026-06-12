import { PartialType } from '@nestjs/swagger';
import { CreateUserSessionDto } from './create-user_session.dto';

export class UpdateUserSessionDto extends PartialType(CreateUserSessionDto) {}
