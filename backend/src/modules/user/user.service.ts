import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { hashPass } from 'src/utils/handlePassword';
import { UserRole, UserStatus, VerificationType } from '@project/shared';
import { nanoid } from 'nanoid';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserVerification } from '../user_verification/entities/user_verification.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}
  async create(data: {
    email: string;
    fullName?: string;
    avatar?: string;
    googleId: string;
  }) {
    let fullName = data.fullName;
    if (!fullName) {
      fullName = `User-${nanoid(4)}`;
    }
    return await this.userRepo.save({
      email: data.email,
      googleId: data.googleId,
      fullName,
      ...(data.avatar ? { avatar: data.avatar } : {}),
    });
  }

  async findUserById(userId: number) {
    return await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: [],
    });
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
      relations: ['verifications'],
    });
    return user;
  }

  async register(dataRegister: RegisterDto) {
    const { email, password } = dataRegister;
    const hashPassword = await hashPass(password);
    const fullName = `User-${nanoid(4)}`;

    const { newUser, verifyToken } = await this.dataSource.transaction(
      async (manager) => {
        try {
          const newUser = await manager.save(User, {
            email,
            password: hashPassword,
            role: UserRole.USER,
            fullName,
            isVerified: false,
          });

          const verifyToken = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
          const expiredAt = new Date(Date.now() + 1000 * 60 * 5);
          await manager.save(UserVerification, {
            type: VerificationType.EMAIL,
            token: verifyToken,
            expiredAt,
            user: {
              id: newUser.id,
            },
          });

          return { newUser, verifyToken };
        } catch (error: any) {
          if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ER_DUP_ENTRY'
          ) {
            throw new BadRequestException('Email đã tồn tại!');
          }
          throw error;
        }
      },
    );
    try {
      await this.mailService.sendVerifyEmail(email, verifyToken);
    } catch (error) {
      console.log('Send mail failed', error);
    }

    return newUser;
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

      if (dataUpdate.isVerified) {
        user.isVerified = dataUpdate.isVerified;
      }

      await this.userRepo.save(user);

      return {
        message: 'Cập nhật người dùng thành công!',
        data: user,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async updatePassword(email: string, newPassword: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy email!');
    }
    await this.userRepo.update(user.id, {
      password: newPassword,
    });
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
