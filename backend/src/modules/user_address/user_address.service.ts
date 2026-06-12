import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAddress } from './entities/user_address.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepo: Repository<UserAddress>,
    @Inject(forwardRef(() => UserService))
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

    const countAddress = await this.userAddressRepo.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });

    if (countAddress === 0) {
      data.isDefault = true;
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
      await this.userAddressRepo
        .createQueryBuilder()
        .update(UserAddress)
        .set({ isDefault: false })
        .where('user_id = :user_id', { user_id: userReq.id })
        .andWhere('id != :id', { id })
        .execute();
    }

    if (address.isDefault && data.isDefault === false) {
      throw new BadRequestException('Phải có ít nhất một địa chỉ mặc định!');
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

  async setDefaultAddress(
    userId: number,
    addressId: number,
    manager: EntityManager,
  ) {
    const address = await manager.findOne(UserAddress, {
      where: {
        id: addressId,
        user: {
          id: userId,
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ!');
    }

    await manager.update(
      UserAddress,
      {
        user: {
          id: userId,
        },
      },
      {
        isDefault: false,
      },
    );

    await manager.update(UserAddress, addressId, {
      isDefault: true,
    });
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
        isDefault: true,
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

  async deleteUserAddress(id: number, userId: number) {
    const userAddress = await this.userAddressRepo.findOne({
      where: {
        id,
      },
    });

    if (!userAddress) {
      throw new NotFoundException('Không địa chỉ!');
    }

    await this.userAddressRepo.delete(userAddress.id);

    if (userAddress.isDefault) {
      const anotherAddress = await this.userAddressRepo.findOne({
        where: {
          user: {
            id: userId,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await this.userAddressRepo.save(anotherAddress);
      }
    }

    return {
      message: 'Đã xóa địa chỉ người dùng!',
    };
  }
}
