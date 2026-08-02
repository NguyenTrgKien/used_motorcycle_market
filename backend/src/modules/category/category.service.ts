import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Repository } from 'typeorm';
import { CategoryStatus } from 'src/shared';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  getDefaultListingFormSchema,
  normalizeListingFormSchema,
} from './listing-form-schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async uploadImage(image?: Express.Multer.File) {
    if (!image) return undefined;
    if (!image.mimetype.startsWith('image/')) {
      throw new BadRequestException('Ảnh danh mục phải là hình ảnh');
    }
    return this.cloudinaryService.uploadSingleFile(image);
  }

  private async generateUniqueSlug(name: string, excludeId?: number) {
    const baseSlug =
      slugify(name, { lower: true, locale: 'vi', strict: true }) || 'danh-muc';
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const query = this.categoryRepo
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('category.id != :id', { id: excludeId });
      }

      const exists = await query.getOne();
      if (!exists) return slug;

      count++;
      slug = `${baseSlug}-${count}`;
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    image?: Express.Multer.File,
  ) {
    try {
      const name = createCategoryDto.name.trim();
      if (!name)
        throw new BadRequestException('Tên danh mục không được để trống');

      const exists = await this.categoryRepo.findOne({ where: { name } });
      if (exists) throw new BadRequestException('Danh mục đã tồn tại');

      const uploadedImage = await this.uploadImage(image);
      const slug = await this.generateUniqueSlug(name);
      const category = this.categoryRepo.create({
        name,
        description: createCategoryDto.description?.trim() || undefined,
        image: uploadedImage?.url,
        imagePublicId: uploadedImage?.publicId,
        slug,
        listingFormSchema: getDefaultListingFormSchema(slug),
      });

      await this.categoryRepo.save(category);

      return {
        message: 'Thêm danh mục thành công',
        data: category,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async update(
    id: number,
    dataUpdate: UpdateCategoryDto,
    image?: Express.Multer.File,
  ) {
    try {
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) throw new NotFoundException('Không tìm thấy danh mục');

      if (dataUpdate.name !== undefined) {
        const name = dataUpdate.name.trim();
        if (!name) {
          throw new BadRequestException('Tên danh mục không được để trống');
        }

        const exists = await this.categoryRepo
          .createQueryBuilder('category')
          .where('category.name = :name', { name })
          .andWhere('category.id != :id', { id })
          .getOne();

        if (exists) throw new BadRequestException('Tên danh mục đã tồn tại');

        if (name !== category.name) {
          category.name = name;
          category.slug = await this.generateUniqueSlug(name, id);
        }
      }

      if (dataUpdate.description !== undefined) {
        category.description = dataUpdate.description.trim();
      }

      if (image) {
        const uploadedImage = await this.uploadImage(image);
        if (category.imagePublicId) {
          await this.cloudinaryService.deleteFile(category.imagePublicId);
        }
        category.image = uploadedImage?.url;
        category.imagePublicId = uploadedImage?.publicId;
      } else if (dataUpdate.removeImage) {
        if (category.imagePublicId) {
          await this.cloudinaryService.deleteFile(category.imagePublicId);
        }
        category.image = undefined;
        category.imagePublicId = undefined;
      }

      await this.categoryRepo.save(category);

      return {
        message: 'Cập nhật danh mục thành công',
        data: category,
      };
    } catch (error) {
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
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) throw new NotFoundException('Không tìm thấy danh mục');

      category.status =
        category.status === CategoryStatus.ACTIVE
          ? CategoryStatus.INACTIVE
          : CategoryStatus.ACTIVE;

      await this.categoryRepo.save(category);

      return {
        message:
          category.status === CategoryStatus.ACTIVE
            ? 'Đã bật danh mục'
            : 'Đã tắt danh mục',
        data: category,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getAllCategories() {
    try {
      const categories = await this.categoryRepo.find({
        order: { createdAt: 'ASC' },
      });

      return {
        message: 'Lấy danh sách danh mục thành công',
        data: categories.map((category) => ({
          ...category,
          listingFormSchema: normalizeListingFormSchema(
            category.listingFormSchema,
            category.slug,
          ),
        })),
      };
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async getCategoryBySlug(slug: string) {
    try {
      const category = await this.categoryRepo.findOne({ where: { slug } });
      if (!category) throw new NotFoundException('Không tìm thấy danh mục');

      return {
        message: 'Lấy thông tin danh mục thành công',
        data: {
          ...category,
          listingFormSchema: normalizeListingFormSchema(
            category.listingFormSchema,
            category.slug,
          ),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }
}
