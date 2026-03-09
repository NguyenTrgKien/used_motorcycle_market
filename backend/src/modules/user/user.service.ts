import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { hashPass } from 'src/utils/handlePassword';
import { UserRole, UserStatus } from '@project/shared';
import { nanoid } from 'nanoid';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
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
      const verifyToken = nanoid(32);
      const entity = this.userRepo.create({
        email,
        password: hashPassword,
        role: UserRole.USER,
        fullName,
        isVerified: false,
        verifyToken,
      });

      await this.userRepo.save(entity);

      await this.mailService.sendVerifyEmail(email, fullName, verifyToken);

      return entity;
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getAllUsers() {
    try {
      const user = await this.userRepo.find({
        where: {
          status: UserStatus.ACTIVE,
        },
      });
      return {
        message: 'Lấy danh sách người dùng thành công!',
        data: user || [],
      };
    } catch (error) {
      console.log(error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại!');
      }

      return {
        message: 'Lấy thông tin người dùng thành công!',
        data: user,
      };
    } catch (error) {
      console.log(error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async updateUser(
    id: number,
    dataUpdate: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }

      if (avatar) {
        const uploadResult =
          await this.cloudinaryService.uploadSingleFile(avatar);
        user.avatar = uploadResult.url;
        user.publicId = uploadResult.publicId;
      }

      if (dataUpdate.email) {
        user.email = dataUpdate.email;
      }
      if (dataUpdate.fullName) {
        user.fullName = dataUpdate.fullName;
      }
      if (dataUpdate.phone) {
        user.phone = dataUpdate.phone;
      }
      if (dataUpdate.province) {
        user.province = dataUpdate.province;
      }

      await this.userRepo.save(user);

      return {
        message: 'Cập nhật người dùng thành công!',
        data: user,
      };
    } catch (error) {
      console.log('==========================>', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async banUser(id: number) {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng!');
      }

      await this.userRepo.update(id, {
        status: UserStatus.BANNED,
      });

      return {
        message: 'Đã ban người dùng!',
      };
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server:  ${err.message}`);
    }
  }
}
