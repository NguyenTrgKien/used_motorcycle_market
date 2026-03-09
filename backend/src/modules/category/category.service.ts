import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import slugify from 'slugify';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryStatus } from '@project/shared';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async generateUniqueSlug(
    name: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSlug = slugify(name, {
      lower: true,
      locale: 'vi',
      strict: true,
    });

    let slug = baseSlug;
    let count = 1;

    while (true) {
      const query = this.categoryRepo
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('category.id != :id', { id: excludeId });
      }

      const exist = await query.getOne();
      if (!exist) break;

      slug = `${baseSlug}-${count + 1}`;
      count++;
    }

    return slug;
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    image: Express.Multer.File,
  ) {
    try {
      const { name, description, icon } = createCategoryDto;
      const existCate = await this.categoryRepo.findOne({
        where: {
          name,
        },
      });
      if (existCate) {
        throw new BadRequestException('Danh mục đã tồn tại!');
      }
      let publicId: string | undefined;
      let imageUrl: string | undefined;
      if (image) {
        const uploadResult =
          await this.cloudinaryService.uploadSingleFile(image);
        publicId = uploadResult.publicId;
        imageUrl = uploadResult.url;
      }

      const slug = await this.generateUniqueSlug(name);

      const newCategory = this.categoryRepo.create({
        name,
        description,
        slug,
        ...(publicId && { publicId }),
        ...(icon ? { icon: icon } : {}),
        ...(image ? { image: imageUrl } : {}),
      });

      await this.categoryRepo.save(newCategory);

      return {
        message: 'Thêm danh mục thành công!',
      };
    } catch (error) {
      console.log('=============================>', error);
      const err = error as Error;
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async update(
    id: number,
    dataUpdate: UpdateCategoryDto,
    image?: Express.Multer.File,
  ) {
    try {
      const category = await this.categoryRepo.findOne({
        where: {
          id,
        },
      });

      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục này!');
      }

      if (dataUpdate.name && dataUpdate.name !== category.name) {
        const existName = await this.categoryRepo
          .createQueryBuilder('category')
          .where('category.name = :name', { name: dataUpdate.name })
          .andWhere('category.id != :id', { id })
          .getOne();
        if (existName) {
          throw new BadRequestException('Tên danh mục đã tồn tại!');
        }

        category.slug = await this.generateUniqueSlug(dataUpdate.name, id);
        category.name = dataUpdate.name;
      }

      if (image) {
        if (category.publicId) {
          await this.cloudinaryService.deleteFile(category.publicId);
        }
        const uploadResult =
          await this.cloudinaryService.uploadSingleFile(image);
        category.publicId = uploadResult.publicId;
        category.image = uploadResult.url;
      }

      if (dataUpdate.description) {
        category.description = dataUpdate.description;
      }
      if (dataUpdate.icon) {
        category.icon = dataUpdate.icon;
      }

      await this.categoryRepo.save(category);

      return {
        message: 'Cập nhật danh mục thành công!',
      };
    } catch (error) {
      console.log('=============================>', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async toggleActive(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: {
          id,
        },
      });

      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục này!');
      }

      category.status =
        category.status === CategoryStatus.ACTIVE
          ? CategoryStatus.INACTIVE
          : CategoryStatus.ACTIVE;

      await this.categoryRepo.save(category);

      return {
        message: `Danh mục đã được ${category.status === CategoryStatus.ACTIVE ? 'bật' : 'tắt'} hoạt động!`,
      };
    } catch (error) {
      console.log('=============================>', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getAllCategories() {
    try {
      const categories = await this.categoryRepo.find();
      return {
        message: 'Lấy danh sách danh mục thành công!',
        data: categories,
      };
    } catch (error) {
      console.log('=============================>', error);
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getCategoryBySlug(slug: string) {
    try {
      const category = await this.categoryRepo.findOne({
        where: {
          slug,
        },
      });

      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục này!');
      }

      await this.categoryRepo.save(category);

      return {
        message: 'Lấy thông tin danh mục thành công!',
        data: category,
      };
    } catch (error) {
      console.log('=============================>', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }
}
