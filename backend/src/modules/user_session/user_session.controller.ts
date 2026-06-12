import { Controller, Post, Body } from '@nestjs/common';
import { UserSessionService } from './user_session.service';
import { CreateUserSessionDto } from './dto/create-user_session.dto';

@Controller('user-session')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}

  @Post()
  create(@Body() createUserSessionDto: CreateUserSessionDto) {
    return this.userSessionService.create(createUserSessionDto);
  }
}
