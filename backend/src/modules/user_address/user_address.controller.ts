import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { UserAddressService } from './user_address.service';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import type { RequestWithUser } from '../auth/auth.controller';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

@Controller('user-addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Post()
  create(@Body() data: CreateUserAddressDto, @Req() req: RequestWithUser) {
    const user = req.user;
    return this.userAddressService.create(data, user);
  }

  @Patch('/:id')
  update(
    @Body() data: UpdateUserAddressDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.userAddressService.update(id, data, user);
  }

  @Get()
  getUserAddresses(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.userAddressService.getUserAddresses(user);
  }
}
