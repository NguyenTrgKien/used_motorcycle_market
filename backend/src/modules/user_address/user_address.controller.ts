import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserAddressService } from './user_address.service';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import type { RequestWithUser } from '../auth/auth.controller';

@Controller('user-addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Post()
  create(@Body() data: CreateUserAddressDto, @Req() req: RequestWithUser) {
    const user = req.user;
    return this.userAddressService.create(data, user);
  }

  @Get()
  getUserAddresses() {
    return this.userAddressService.getUserAddresses();
  }
}
