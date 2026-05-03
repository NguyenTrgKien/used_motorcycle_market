import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAddress } from './entities/user_address.entity';
import { Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepo: Repository<UserAddress>,
    private readonly userService: UserService,
  ) {}

  async create(data: CreateUserAddressDto, userReq: User) {
    const user = await this.userService.findUserById(userReq.id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }
    const userAddress = this.userAddressRepo.create({
      ...data,
      user: {
        id: user.id,
      },
    });
    await this.userAddressRepo.save(userAddress);
    return {
      message: 'Thêm địa chỉ thành công!',
      data: userAddress,
    };
  }

  async getUserAddresses() {
    const userAddresses = await this.userAddressRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
    return {
      message: 'Thêm địa chỉ thành công!',
      data: userAddresses,
    };
  }
}
