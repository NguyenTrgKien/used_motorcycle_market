import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateVehicleBrandDto } from './dto/create-vehicle-brand.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleBrandDto } from './dto/update-vehicle-brand.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleBrand } from './entities/vehicle_brand.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(VehicleBrand)
    private readonly brandRepo: Repository<VehicleBrand>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async generateUniqueBrandSlug(name: string, excludeId?: number) {
    const baseSlug =
      slugify(name, { lower: true, locale: 'vi', strict: true }) || 'hang-xe';
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const query = this.brandRepo
        .createQueryBuilder('brand')
        .where('brand.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('brand.id != :id', { id: excludeId });
      }

      const exists = await query.getOne();
      if (!exists) return slug;

      count++;
      slug = `${baseSlug}-${count}`;
    }
  }

  private async resolveCategories(categoryIds?: number[]) {
    if (!categoryIds?.length) return [];

    const uniqueIds = Array.from(new Set(categoryIds));
    const categories = await this.categoryRepo
      .createQueryBuilder('category')
      .where('category.id IN (:...ids)', { ids: uniqueIds })
      .getMany();

    if (categories.length !== uniqueIds.length) {
      throw new BadRequestException('Danh mục hãng xe không hợp lệ');
    }

    return categories;
  }

  private async uploadLogo(logo?: Express.Multer.File) {
    if (!logo) return undefined;
    if (!logo.mimetype.startsWith('image/')) {
      throw new BadRequestException('Logo hãng xe phải là hình ảnh');
    }

    return this.cloudinaryService.uploadSingleFile(logo);
  }

  async findAllBrands() {
    const brands = await this.brandRepo.find({
      relations: { categories: true },
      order: { name: 'ASC' },
    });

    return {
      message: 'Lấy danh sách hãng xe thành công',
      data: brands,
    };
  }

  async createBrand(
    createVehicleBrandDto: CreateVehicleBrandDto,
    logo?: Express.Multer.File,
  ) {
    const name = createVehicleBrandDto.name.trim();
    if (!name) throw new BadRequestException('Tên hãng xe không được để trống');

    const exists = await this.brandRepo.findOne({ where: { name } });
    if (exists) throw new BadRequestException('Hãng xe đã tồn tại');

    const categories = await this.resolveCategories(
      createVehicleBrandDto.categoryIds,
    );
    const uploadedLogo = await this.uploadLogo(logo);
    const brand = this.brandRepo.create({
      name,
      slug: await this.generateUniqueBrandSlug(name),
      logo: uploadedLogo?.url,
      publicId: uploadedLogo?.publicId,
      country: createVehicleBrandDto.country?.trim() || undefined,
      categories,
    });

    await this.brandRepo.save(brand);

    return {
      message: 'Thêm hãng xe thành công',
      data: brand,
    };
  }

  async updateBrand(
    id: number,
    updateVehicleBrandDto: UpdateVehicleBrandDto,
    logo?: Express.Multer.File,
  ) {
    const brand = await this.brandRepo.findOne({
      where: { id },
      relations: { categories: true },
    });
    if (!brand) throw new NotFoundException('Không tìm thấy hãng xe');

    if (updateVehicleBrandDto.name !== undefined) {
      const name = updateVehicleBrandDto.name.trim();
      if (!name) throw new BadRequestException('Tên hãng xe không được để trống');

      const existing = await this.brandRepo
        .createQueryBuilder('brand')
        .where('brand.name = :name', { name })
        .andWhere('brand.id != :id', { id })
        .getOne();

      if (existing) throw new BadRequestException('Hãng xe đã tồn tại');

      if (name !== brand.name) {
        brand.name = name;
        brand.slug = await this.generateUniqueBrandSlug(name, id);
      }
    }

    if (logo) {
      const uploadedLogo = await this.uploadLogo(logo);
      if (brand.publicId) {
        await this.cloudinaryService.deleteFile(brand.publicId);
      }
      brand.logo = uploadedLogo?.url;
      brand.publicId = uploadedLogo?.publicId;
    }

    if (updateVehicleBrandDto.country !== undefined) {
      brand.country = updateVehicleBrandDto.country.trim() || undefined;
    }

    if (updateVehicleBrandDto.categoryIds !== undefined) {
      brand.categories = await this.resolveCategories(
        updateVehicleBrandDto.categoryIds,
      );
    }

    await this.brandRepo.save(brand);

    return {
      message: 'Cập nhật hãng xe thành công',
      data: brand,
    };
  }

  async toggleBrandActive(id: number) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Không tìm thấy hãng xe');

    brand.isActive = !brand.isActive;
    await this.brandRepo.save(brand);

    return {
      message: brand.isActive ? 'Đã bật hãng xe' : 'Đã tắt hãng xe',
      data: brand,
    };
  }

  create(createVehicleDto: CreateVehicleDto) {
    return 'This action adds a new vehicle';
  }

  findAll() {
    return `This action returns all vehicle`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicle`;
  }

  update(id: number, updateVehicleDto: UpdateVehicleDto) {
    return `This action updates a #${id} vehicle`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicle`;
  }
}
