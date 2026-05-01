import { Injectable } from '@nestjs/common';
import { CreateUserIdentityDto } from './dto/create-user_identity.dto';
import { UpdateUserIdentityDto } from './dto/update-user_identity.dto';

@Injectable()
export class UserIdentityService {
  create(createUserIdentityDto: CreateUserIdentityDto) {
    return 'This action adds a new userIdentity';
  }

  findAll() {
    return `This action returns all userIdentity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userIdentity`;
  }

  update(id: number, updateUserIdentityDto: UpdateUserIdentityDto) {
    return `This action updates a #${id} userIdentity`;
  }

  remove(id: number) {
    return `This action removes a #${id} userIdentity`;
  }
}
