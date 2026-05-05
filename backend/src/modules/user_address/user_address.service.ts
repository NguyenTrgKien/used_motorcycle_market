import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAddress } from './entities/user_address.entity';
import { Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

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

    if (data.isDefault) {
      await this.userAddressRepo.update(
        { user: { id: user.id }, isDefault: true },
        { isDefault: false },
      );
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

  async update(id: number, data: UpdateUserAddressDto, userReq: User) {
    const address = await this.userAddressRepo.findOne({
      where: {
        id: id,
        user: {
          id: userReq.id,
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ!');
    }

    if (data.isDefault) {
      await this.userAddressRepo.update(
        { user: { id: userReq.id }, isDefault: true },
        { isDefault: false },
      );
    }

    await this.userAddressRepo.update(id, data);

    const updated = await this.userAddressRepo.findOne({
      where: { id },
    });
    return {
      message: 'Cập nhật địa chỉ thành công!',
      data: updated,
    };
  }

  async getUserAddresses(user: User) {
    const userAddresses = await this.userAddressRepo.find({
      where: {
        user: {
          id: user.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
      select: {
        id: true,
        address: true,
        province: true,
        district: true,
        ward: true,
        createdAt: true,
        user: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      },
    });
    return {
      message: 'Lấy danh sách địa chỉ thành công!',
      data: userAddresses,
    };
  }
}
