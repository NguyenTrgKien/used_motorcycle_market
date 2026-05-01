import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserIdentityService } from './user_identity.service';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { UpdateUserIdentityDto } from './dto/update-user_identity.dto';

@Controller('user-identity')
export class UserIdentityController {
  constructor(private readonly userIdentityService: UserIdentityService) {}

  @Post()
  create(@Body() createUserIdentityDto: CreateUserIdentityDto) {
    return this.userIdentityService.create(createUserIdentityDto);
  }

  @Get()
  findAll() {
    return this.userIdentityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userIdentityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserIdentityDto: UpdateUserIdentityDto) {
    return this.userIdentityService.update(+id, updateUserIdentityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userIdentityService.remove(+id);
  }
}
