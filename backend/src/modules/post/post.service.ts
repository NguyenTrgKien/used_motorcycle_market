import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SuggestVehiclePriceDto } from './dto/suggest-vehicle-price.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { PostImage } from '../post_image/entities/post_image.entity';
import { Category } from '../category/entities/category.entity';
import { VehicleBrand } from '../vehicle/entities/vehicle_brand.entity';
import { VehicleModel } from '../vehicle/entities/vehicle_model.entity';
import { Review } from '../review/entities/review.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import slugify from 'slugify';
import { CategoryStatus, PostStatus, VehicleBodyType } from 'src/shared';
import {
  GeminiVisionService,
  PriceComparable,
} from '../gemini-rate-limiter/services/gemini-vision.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(VehicleBrand)
    private readonly brandRepo: Repository<VehicleBrand>,
    @InjectRepository(VehicleModel)
    private readonly modelRepo: Repository<VehicleModel>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly geminiVisionService: GeminiVisionService,
  ) {}

  private toNumber(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseExtraSpecs(value?: string): Record<string, unknown> | undefined {
    if (!value) return undefined;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : undefined;
    } catch {
      throw new BadRequestException('Thông số bổ sung không hợp lệ');
    }
  }

  private async generateUniqueSlug(title: string, excludeId?: number) {
    const baseSlug =
      slugify(title, { lower: true, locale: 'vi', strict: true }) || 'tin-dang';
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const query = this.postRepo
        .createQueryBuilder('post')
        .where('post.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('post.id != :id', { id: excludeId });
      }

      const exists = await query.getOne();
      if (!exists) return slug;

      count++;
      slug = `${baseSlug}-${count}`;
    }
  }

  private async resolveVehicleNames(data: CreatePostDto | UpdatePostDto) {
    let brandName = data.brandName?.trim();
    let modelName = data.modelName?.trim();
    const brandId = this.toNumber(data.brandId);
    const modelId = this.toNumber(data.modelId);

    if (brandId) {
      const brand = await this.brandRepo.findOne({ where: { id: brandId } });
      if (!brand) throw new BadRequestException('Hãng xe không hợp lệ');
      brandName = brand.name;
    }

    if (modelId) {
      const model = await this.modelRepo.findOne({ where: { id: modelId } });
      if (!model) throw new BadRequestException('Dòng xe không hợp lệ');
      modelName = model.name;
    }

    return {
      brandId,
      modelId,
      brandName: brandName || 'Khác',
      modelName: modelName || 'Khác',
    };
  }

  private buildVehiclePayload(
    postId: number,
    categoryId: number,
    data: CreatePostDto | UpdatePostDto,
    names: {
      brandId?: number;
      modelId?: number;
      brandName: string;
      modelName: string;
    },
  ) {
    return {
      postId,
      categoryId,
      brandId: names.brandId,
      modelId: names.modelId,
      brandName: names.brandName,
      modelName: names.modelName,
      bodyType: data.bodyType || VehicleBodyType.OTHER,
      manufactureYear: this.toNumber(data.manufactureYear),
      registrationYear: this.toNumber(data.registrationYear),
      mileage: this.toNumber(data.mileage),
      color: data.color || undefined,
      condition: data.condition,
      engineCapacity: data.engineCapacity || undefined,
      enginePower: data.enginePower || undefined,
      batteryCapacity: data.batteryCapacity || undefined,
      rangePerCharge: data.rangePerCharge || undefined,
      licensePlate: data.licensePlate || undefined,
      fuelType: data.fuelType,
      transmission: data.transmission,
      origin: data.origin || undefined,
      documentsStatus: data.documentsStatus || undefined,
      seatCount: this.toNumber(data.seatCount),
      doorCount: this.toNumber(data.doorCount),
      payloadKg: this.toNumber(data.payloadKg),
      grossWeightKg: this.toNumber(data.grossWeightKg),
      wheelCount: this.toNumber(data.wheelCount),
      extraSpecs: this.parseExtraSpecs(data.extraSpecs),
    };
  }

  async analyzeImages(images: Express.Multer.File[]) {
    return this.geminiVisionService.analyzeImages(images);
  }

  async suggestPrice(data: SuggestVehiclePriceDto) {
    const missingFields = [
      !data.brandName?.trim() ? 'hãng xe' : '',
      !data.modelName?.trim() ? 'dòng xe' : '',
      !data.bodyType ? 'loại xe' : '',
      !data.manufactureYear && !data.registrationYear
        ? 'năm sản xuất hoặc năm đăng ký'
        : '',
      !data.mileage ? 'số km' : '',
      !data.condition ? 'tình trạng xe' : '',
      !data.fuelType ? 'nhiên liệu' : '',
      !data.transmission ? 'hộp số' : '',
      !data.province?.trim() ? 'tỉnh/thành phố' : '',
    ].filter(Boolean);

    if (missingFields.length) {
      throw new BadRequestException(
        `Vui lòng bổ sung ${missingFields.join(', ')} để AI gợi ý giá`,
      );
    }

    const comparables = await this.findPriceComparables(data);
    return this.geminiVisionService.suggestVehiclePrice(data, comparables);
  }

  private async findPriceComparables(
    data: SuggestVehiclePriceDto,
  ): Promise<PriceComparable[]> {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('post.price > 0')
      .orderBy('post.createdAt', 'DESC')
      .take(12);

    if (data.bodyType) {
      qb.andWhere('vehicle.bodyType = :bodyType', { bodyType: data.bodyType });
    }

    if (data.brandName?.trim()) {
      qb.andWhere('vehicle.brandName ILIKE :brandName', {
        brandName: `%${data.brandName.trim()}%`,
      });
    }

    if (data.modelName?.trim()) {
      qb.andWhere('vehicle.modelName ILIKE :modelName', {
        modelName: `%${data.modelName.trim()}%`,
      });
    }

    if (data.province?.trim()) {
      qb.andWhere('post.province = :province', { province: data.province });
    }

    const posts = await qb.getMany();
    return posts.map((post) => ({
      title: post.title,
      price: Number(post.price),
      province: post.province,
      brandName: post.vehicle?.brandName,
      modelName: post.vehicle?.modelName,
      bodyType: post.vehicle?.bodyType,
      manufactureYear: post.vehicle?.manufactureYear,
      mileage: post.vehicle?.mileage,
      condition: post.vehicle?.condition,
      fuelType: post.vehicle?.fuelType,
      transmission: post.vehicle?.transmission,
    }));
  }

  private async validateVehicleImages(images: Express.Multer.File[]) {
    const invalidFile = images.find(
      (image) => !image.mimetype.startsWith('image/'),
    );
    if (invalidFile) {
      throw new BadRequestException('File tải lên phải là hình ảnh');
    }

    const analysis = await this.geminiVisionService.analyzeImages(images);
    if (!analysis.data.isVehicle) {
      throw new BadRequestException(
        analysis.data.rejectReason ||
          'Hình ảnh không hợp lệ hoặc không liên quan đến xe',
      );
    }

    return analysis;
  }

  private validateDocumentImages(documentImages: Express.Multer.File[]) {
    if (documentImages.length > 4) {
      throw new BadRequestException('Chỉ được tải lên tối đa 4 ảnh giấy tờ xe');
    }

    const invalidFile = documentImages.find(
      (image) => !image.mimetype.startsWith('image/'),
    );
    if (invalidFile) {
      throw new BadRequestException('Ảnh giấy tờ xe phải là hình ảnh');
    }
  }

  async create(
    userId: number,
    createPostDto: CreatePostDto,
    images: Express.Multer.File[],
    documentImages: Express.Multer.File[] = [],
  ) {
    try {
      if (!images.length) {
        throw new BadRequestException('Vui lòng tải lên ít nhất một hình ảnh');
      }

      const categoryId = Number(createPostDto.categoryId);
      const category = await this.categoryRepo.findOne({
        where: { id: categoryId, status: CategoryStatus.ACTIVE },
      });

      if (!category) {
        throw new BadRequestException('Danh mục không hợp lệ');
      }

      await this.validateVehicleImages(images);
      this.validateDocumentImages(documentImages);

      const uploadedImages =
        await this.cloudinaryService.uploadMultipleFile(images);
      const uploadedDocumentImages = documentImages.length
        ? await this.cloudinaryService.uploadMultipleFile(documentImages)
        : [];
      const slug = await this.generateUniqueSlug(createPostDto.title);
      const names = await this.resolveVehicleNames(createPostDto);

      const post = await this.dataSource.transaction(async (manager) => {
        const newPost = manager.create(Post, {
          userId,
          categoryId,
          title: createPostDto.title,
          description: createPostDto.description,
          price: Number(createPostDto.price),
          status: PostStatus.PENDING,
          province: createPostDto.province,
          district: createPostDto.district,
          ward: createPostDto.ward,
          addressDetail: createPostDto.addressDetail,
          slug,
        });

        const savedPost = await manager.save(Post, newPost);
        const vehicle = manager.create(
          Vehicle,
          {
            ...this.buildVehiclePayload(
              savedPost.id,
              categoryId,
              createPostDto,
              names,
            ),
            documentImages: uploadedDocumentImages,
          },
        );
        await manager.save(Vehicle, vehicle);

        const postImages = uploadedImages.map((image, index) =>
          manager.create(PostImage, {
            postId: savedPost.id,
            imageUrl: image.url,
            publicId: image.publicId,
            sortOrder: index,
            isPrimary: index === 0,
          }),
        );

        await manager.save(PostImage, postImages);

        return savedPost;
      });

      return {
        message: 'Đăng tin thành công, vui lòng chờ kiểm duyệt',
        data: post,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(`Lỗi server: ${err.message}`);
    }
  }

  async findAll(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.avatar', 'user.isVerified'])
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.categoryId) {
      qb.andWhere('post.categoryId = :categoryId', {
        categoryId: Number(query.categoryId),
      });
    }

    if (query.province) {
      qb.andWhere('post.province = :province', { province: query.province });
    }

    if (query.keyword) {
      qb.andWhere(
        '(post.title ILIKE :keyword OR post.description ILIKE :keyword)',
        {
          keyword: `%${query.keyword}%`,
        },
      );
    }

    if (query.bodyType) {
      qb.andWhere('vehicle.bodyType = :bodyType', { bodyType: query.bodyType });
    }

    if (query.fuelType) {
      qb.andWhere('vehicle.fuelType = :fuelType', { fuelType: query.fuelType });
    }

    if (query.minPrice) {
      qb.andWhere('post.price >= :minPrice', {
        minPrice: Number(query.minPrice),
      });
    }

    if (query.maxPrice) {
      qb.andWhere('post.price <= :maxPrice', {
        maxPrice: Number(query.maxPrice),
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Lấy danh sách tin đăng thành công',
      data: {
        items,
        total,
        page,
        limit,
      },
    };
  }

  async findMine(userId: number) {
    const posts = await this.postRepo.find({
      where: { userId },
      relations: {
        vehicle: true,
        post_images: true,
        category: true,
      },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Lấy danh sách tin của tôi thành công',
      data: posts,
    };
  }

  async findOne(slug: string) {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .addSelect([
        'user.id',
        'user.fullName',
        'user.avatar',
        'user.isVerified',
        'user.phone',
        'user.showPhone',
      ])
      .where('post.slug = :slug', { slug })
      .getOne();

    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    await this.postRepo.increment({ id: post.id }, 'viewCount', 1);

    const reviewSummary = post.user
      ? await this.reviewRepo
          .createQueryBuilder('review')
          .select('COUNT(review.id)', 'count')
          .addSelect('AVG(review.rating)', 'average')
          .where('review.revieweeId = :sellerId', { sellerId: post.user.id })
          .getRawOne<{ count: string; average: string | null }>()
      : undefined;

    const seller = post.user
      ? {
          id: post.user.id,
          fullName: post.user.fullName,
          avatar: post.user.avatar,
          isVerified: post.user.isVerified,
          phone: post.user.showPhone ? post.user.phone : undefined,
          reviewCount: Number(reviewSummary?.count || 0),
          averageRating: reviewSummary?.average
            ? Number(Number(reviewSummary.average).toFixed(1))
            : 0,
        }
      : undefined;

    return {
      message: 'Lấy chi tiết tin đăng thành công',
      data: {
        ...post,
        user: seller,
        viewCount: post.viewCount + 1,
      },
    };
  }

  async update(
    userId: number,
    id: number,
    updatePostDto: UpdatePostDto,
    images: Express.Multer.File[],
    documentImages: Express.Multer.File[] = [],
  ) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: { vehicle: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin này');
    }

    const categoryId = updatePostDto.categoryId
      ? Number(updatePostDto.categoryId)
      : post.categoryId;

    if (updatePostDto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: categoryId, status: CategoryStatus.ACTIVE },
      });
      if (!category) throw new BadRequestException('Danh mục không hợp lệ');
    }

    if (images.length) {
      await this.validateVehicleImages(images);
    }
    this.validateDocumentImages(documentImages);

    const uploadedImages = images.length
      ? await this.cloudinaryService.uploadMultipleFile(images)
      : [];
    const uploadedDocumentImages = documentImages.length
      ? await this.cloudinaryService.uploadMultipleFile(documentImages)
      : [];

    const shouldResolveNames = Boolean(
      updatePostDto.brandId ||
        updatePostDto.modelId ||
        updatePostDto.brandName ||
        updatePostDto.modelName,
    );
    const names =
      shouldResolveNames && post.vehicle
        ? await this.resolveVehicleNames(updatePostDto)
        : {
            brandId: post.vehicle?.brandId,
            modelId: post.vehicle?.modelId,
            brandName: post.vehicle?.brandName || 'Khác',
            modelName: post.vehicle?.modelName || 'Khác',
          };

    await this.dataSource.transaction(async (manager) => {
      if (updatePostDto.title && updatePostDto.title !== post.title) {
        post.title = updatePostDto.title;
        post.slug = await this.generateUniqueSlug(updatePostDto.title, post.id);
      }

      if (updatePostDto.categoryId) post.categoryId = categoryId;
      if (updatePostDto.description !== undefined) {
        post.description = updatePostDto.description;
      }
      if (updatePostDto.price) post.price = Number(updatePostDto.price);
      if (updatePostDto.province) post.province = updatePostDto.province;
      if (updatePostDto.district !== undefined)
        post.district = updatePostDto.district;
      if (updatePostDto.ward !== undefined) post.ward = updatePostDto.ward;
      if (updatePostDto.addressDetail !== undefined) {
        post.addressDetail = updatePostDto.addressDetail;
      }
      post.status = PostStatus.PENDING;
      post.rejectedReason = undefined;

      await manager.save(Post, post);

      if (post.vehicle) {
        const mergedVehicleData = {
          ...updatePostDto,
          bodyType: updatePostDto.bodyType || post.vehicle.bodyType,
          condition: updatePostDto.condition || post.vehicle.condition,
          fuelType: updatePostDto.fuelType || post.vehicle.fuelType,
          transmission: updatePostDto.transmission || post.vehicle.transmission,
          brandName:
            updatePostDto.brandName ||
            names.brandName ||
            post.vehicle.brandName,
          modelName:
            updatePostDto.modelName ||
            names.modelName ||
            post.vehicle.modelName,
        };

        Object.assign(
          post.vehicle,
          {
            ...this.buildVehiclePayload(post.id, categoryId, mergedVehicleData, {
              brandId: names.brandId ?? post.vehicle.brandId,
              modelId: names.modelId ?? post.vehicle.modelId,
              brandName: mergedVehicleData.brandName,
              modelName: mergedVehicleData.modelName,
            }),
            documentImages: uploadedDocumentImages.length
              ? uploadedDocumentImages
              : post.vehicle.documentImages,
          },
        );
        await manager.save(Vehicle, post.vehicle);
      }

      if (uploadedImages.length) {
        const currentCount = await manager.count(PostImage, {
          where: { postId: post.id },
        });
        const postImages = uploadedImages.map((image, index) =>
          manager.create(PostImage, {
            postId: post.id,
            imageUrl: image.url,
            publicId: image.publicId,
            sortOrder: currentCount + index,
            isPrimary: currentCount === 0 && index === 0,
          }),
        );
        await manager.save(PostImage, postImages);
      }
    });

    return {
      message: 'Cập nhật tin đăng thành công, vui lòng chờ kiểm duyệt',
    };
  }

  async setPrimaryImage(userId: number, postId: number, imageId: number) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { post_images: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin này');
    }

    const selectedImage = post.post_images.find((image) => image.id === imageId);
    if (!selectedImage) {
      throw new NotFoundException('Không tìm thấy hình ảnh');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(PostImage, { postId }, { isPrimary: false });
      await manager.update(PostImage, { id: imageId }, { isPrimary: true });
      post.status = PostStatus.PENDING;
      post.rejectedReason = undefined;
      await manager.save(Post, post);
    });

    return {
      message: 'Đã cập nhật ảnh đại diện tin đăng',
    };
  }

  async removeImage(userId: number, postId: number, imageId: number) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { post_images: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin này');
    }

    const image = post.post_images.find((item) => item.id === imageId);
    if (!image) throw new NotFoundException('Không tìm thấy hình ảnh');
    if (post.post_images.length <= 1) {
      throw new BadRequestException('Tin đăng cần tối thiểu một hình ảnh');
    }

    const remainingImages = post.post_images
      .filter((item) => item.id !== imageId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PostImage, { id: imageId });

      if (image.isPrimary && remainingImages[0]) {
        await manager.update(
          PostImage,
          { id: remainingImages[0].id },
          { isPrimary: true },
        );
      }

      await Promise.all(
        remainingImages.map((item, index) =>
          manager.update(PostImage, { id: item.id }, { sortOrder: index }),
        ),
      );

      post.status = PostStatus.PENDING;
      post.rejectedReason = undefined;
      await manager.save(Post, post);
    });

    if (image.publicId) {
      await this.cloudinaryService.deleteFile(image.publicId);
    }

    return {
      message: 'Đã xóa hình ảnh tin đăng',
    };
  }

  async markSold(userId: number, id: number) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật tin này');
    }

    post.status = PostStatus.SOLD;
    post.soldAt = new Date();
    await this.postRepo.save(post);

    return {
      message: 'Tin đăng đã được đánh dấu là đã bán',
    };
  }

  async remove(userId: number, id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: { post_images: true, vehicle: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin này');
    }

    const publicIds = post.post_images
      .map((image) => image.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));
    const documentPublicIds = (post.vehicle?.documentImages || [])
      .map((image) => image.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));

    await this.postRepo.delete(id);

    if (publicIds.length || documentPublicIds.length) {
      await this.cloudinaryService.deleteFiles([
        ...publicIds,
        ...documentPublicIds,
      ]);
    }

    return {
      message: 'Xóa tin đăng thành công',
    };
  }
}
