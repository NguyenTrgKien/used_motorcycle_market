import { Injectable } from '@nestjs/common';
import { CreateUserSessionDto } from './dto/create-user_session.dto';

@Injectable()
export class UserSessionService {
  create(createUserSessionDto: CreateUserSessionDto) {
    return 'This action adds a new userSession';
  }
}
