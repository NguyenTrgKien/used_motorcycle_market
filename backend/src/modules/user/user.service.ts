import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { hashPass } from 'src/utils/handlePassword';
import { UserRole } from '@project/shared';
import { nanoid } from 'nanoid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async findUserById(userId: number) {
    return await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: [],
    });
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email })
      .getOne();
    return user;
  }

  async register(dataRegister: RegisterDto) {
    try {
      const { email, password } = dataRegister;

      const user = await this.userRepo.findOne({
        where: {
          email,
        },
      });

      if (user) {
        throw new BadRequestException(
          'Email đã được sử dụng! Vui lòng chọn email khác!',
        );
      }

      const hashPassword = await hashPass(password);
      const fullName = `User-${nanoid(4)}`;
      const entity = this.userRepo.create({
        email,
        password: hashPassword,
        role: UserRole.USER,
        fullName,
      });

      await this.userRepo.save(entity);

      return entity;
    } catch (error) {
      console.log(error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }
}
