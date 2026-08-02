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
import { Report } from '../report/entities/report.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import slugify from 'slugify';
import {
  CategoryStatus,
  NotificationType,
  PostStatus,
  TargetType,
  VehicleBodyType,
  VehicleCondition,
  VehicleFuelType,
  VehicleTransmission,
  UserRole,
  SellerType,
} from 'src/shared';
import {
  GeminiVisionService,
  PriceComparable,
} from '../gemini-rate-limiter/services/gemini-vision.service';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';
import { ListingPaymentService } from '../listing_payment/listing-payment.service';
import { ListingBillingType } from '../listing_payment/listing-payment.types';
import {
  ListingFormSchema,
  ListingVehicleField,
  LISTING_VEHICLE_FIELDS,
  normalizeListingFormSchema,
} from '../category/listing-form-schema';

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
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly geminiVisionService: GeminiVisionService,
    private readonly notificationService: NotificationService,
    private readonly listingPaymentService: ListingPaymentService,
  ) {}

  private toNumber(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseAdminNumberFilter(value: string | undefined, label: string) {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${label} khong hop le`);
    }

    return parsed;
  }

  private parseAdminDateFilter(value: string | undefined, label: string) {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} khong hop le`);
    }

    return value;
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
      condition: data.condition || VehicleCondition.USED,
      engineCapacity: data.engineCapacity || undefined,
      enginePower: data.enginePower || undefined,
      batteryCapacity: data.batteryCapacity || undefined,
      rangePerCharge: data.rangePerCharge || undefined,
      licensePlate: data.licensePlate || undefined,
      fuelType: data.fuelType || VehicleFuelType.OTHER,
      transmission: data.transmission || VehicleTransmission.OTHER,
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
    const categories = await this.categoryRepo.find({
      where: { status: CategoryStatus.ACTIVE },
      select: { id: true, name: true, slug: true, listingFormSchema: true },
      order: { name: 'ASC' },
    });
    const analysis = await this.geminiVisionService.analyzeImages(
      images,
      categories.map(({ slug, name, listingFormSchema }) => ({
        slug,
        name,
        aiFields: normalizeListingFormSchema(listingFormSchema, slug).aiFields,
      })),
    );
    const category = categories.find(
      (item) => item.slug === analysis.data.categorySlug,
    );
    return {
      ...analysis,
      data: {
        ...analysis.data,
        categoryId: category ? String(category.id) : '',
        categoryName: category?.name ?? '',
      },
    };
  }

  async generateImageDescription(images: Express.Multer.File[]) {
    return this.geminiVisionService.generateDescription(images);
  }

  async suggestPrice(data: SuggestVehiclePriceDto) {
    const category = await this.categoryRepo.findOne({
      where: { id: Number(data.categoryId), status: CategoryStatus.ACTIVE },
    });
    if (!category) throw new BadRequestException('Danh mục không hợp lệ');
    const schema = normalizeListingFormSchema(
      category.listingFormSchema,
      category.slug,
    );
    const missingFields = this.getMissingListingFields(data, schema);

    if (missingFields.length) {
      throw new BadRequestException(
        `Vui lòng bổ sung ${missingFields.join(', ')} để AI gợi ý giá`,
      );
    }

    const comparables = await this.findPriceComparables(data);
    return this.geminiVisionService.suggestVehiclePrice(data, comparables);
  }

  private getMissingListingFields(
    data: CreatePostDto | SuggestVehiclePriceDto,
    schema: ListingFormSchema,
  ) {
    const labels: Record<ListingVehicleField, string> = {
      brandName: 'hãng xe', modelName: 'dòng xe', bodyType: 'loại xe',
      manufactureYear: 'năm sản xuất', registrationYear: 'năm đăng ký',
      mileage: 'số km', color: 'màu sắc', condition: 'tình trạng',
      engineCapacity: 'dung tích động cơ', enginePower: 'công suất',
      batteryCapacity: 'dung lượng pin', rangePerCharge: 'quãng đường mỗi lần sạc',
      licensePlate: 'biển số', fuelType: 'nhiên liệu', transmission: 'hộp số',
      origin: 'xuất xứ', documentsStatus: 'giấy tờ xe', seatCount: 'số ghế',
      doorCount: 'số cửa', payloadKg: 'tải trọng', grossWeightKg: 'tổng trọng lượng',
      wheelCount: 'số bánh',
    };
    const fields = [
      ...schema.requiredFields,
      ...(data.condition === VehicleCondition.USED ||
      data.condition === VehicleCondition.GOOD ||
      data.condition === VehicleCondition.FAIR ||
      data.condition === VehicleCondition.EXCELLENT
        ? schema.requiredWhenUsedFields
        : []),
    ];
    return [...new Set(fields)]
      .filter((field) => !String(data[field] || '').trim())
      .map((field) => labels[field]);
  }

  private validateListingFields(data: CreatePostDto, category: Category) {
    const schema = normalizeListingFormSchema(
      category.listingFormSchema,
      category.slug,
    );
    const missingFields = this.getMissingListingFields(data, schema);
    if (missingFields.length) {
      throw new BadRequestException(
        `Vui lòng bổ sung ${missingFields.join(', ')}`,
      );
    }
  }

  private clearUnsupportedListingFields(
    data: CreatePostDto | UpdatePostDto,
    category: Category,
  ) {
    const schema = normalizeListingFormSchema(
      category.listingFormSchema,
      category.slug,
    );
    const values = data as unknown as Record<string, unknown>;
    LISTING_VEHICLE_FIELDS.forEach((field) => {
      if (!schema.visibleFields.includes(field)) values[field] = undefined;
    });
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
          'Hình ảnh không hợp lệ hoặc không liên quan đến xe, phụ kiện xe',
      );
    }

    return analysis;
  }

  private async notifyAdminsAboutPendingPost(post: Post) {
    const staff = await this.userRepo.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.MODERATOR }],
      select: { id: true },
    });

    await Promise.all(
      staff.map((user) =>
        this.notificationService.createNotification({
          userId: user.id,
          title: 'Có tin đăng mới chờ duyệt',
          content: `Tin "${post.title}" đang chờ kiểm duyệt.`,
          type: NotificationType.NEW_POST_PENDING,
          referenceId: post.id,
        }),
      ),
    );
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

      this.clearUnsupportedListingFields(createPostDto, category);
      this.validateListingFields(createPostDto, category);

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
        const billing = await this.listingPaymentService.reserveBilling(
          manager,
          userId,
          category,
        );
        const newPost = manager.create(Post, {
          userId,
          categoryId,
          title: createPostDto.title,
          description: createPostDto.description,
          price: Number(createPostDto.price),
          status:
            billing.billingType === ListingBillingType.FREE
              ? PostStatus.PENDING
              : PostStatus.DRAFT,
          province: createPostDto.province,
          district: createPostDto.district,
          ward: createPostDto.ward,
          addressDetail: createPostDto.addressDetail,
          slug,
          listingBillingType: billing.billingType,
          listingPricingGroup: billing.pricingGroup,
          listingFee: billing.amount,
        });

        const savedPost = await manager.save(Post, newPost);
        const vehicle = manager.create(Vehicle, {
          ...this.buildVehiclePayload(
            savedPost.id,
            categoryId,
            createPostDto,
            names,
          ),
          documentImages: uploadedDocumentImages,
        });
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
      if (post.status === PostStatus.PENDING) {
        await this.notifyAdminsAboutPendingPost(post);
      }

      return {
        message:
          post.status === PostStatus.PENDING
            ? 'Đăng tin thành công, vui lòng chờ kiểm duyệt'
            : 'Tin đã được lưu, vui lòng thanh toán phí đăng tin',
        data: post,
        paymentRequired: post.status === PostStatus.DRAFT,
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
    const publicStatus =
      query.status === PostStatus.SOLD ? PostStatus.SOLD : PostStatus.ACTIVE;
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .leftJoin(
        'user.professionalSellerProfile',
        'professionalSellerProfile',
        'professionalSellerProfile.status = :approvedSellerStatus',
        { approvedSellerStatus: 'approved' },
      )
      .addSelect([
        'user.id',
        'user.fullName',
        'user.avatar',
        'user.isVerified',
        'user.sellerType',
        'professionalSellerProfile.id',
        'professionalSellerProfile.storeName',
        'professionalSellerProfile.logoUrl',
        'professionalSellerProfile.status',
      ])
      .where('post.status = :status', { status: publicStatus })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (
      query.sellerType &&
      ['individual', 'professional'].includes(query.sellerType)
    ) {
      qb.andWhere('user.sellerType = :sellerType', {
        sellerType: query.sellerType,
      });
    }

    if (query.userId) {
      qb.andWhere('post.userId = :userId', {
        userId: Number(query.userId),
      });
    }

    if (query.sort === 'price_asc') {
      qb.orderBy('post.price', 'ASC');
    } else if (query.sort === 'price_desc') {
      qb.orderBy('post.price', 'DESC');
    }

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

  async findSimilar(slug: string, requestedLimit = 4) {
    const limit = Math.min(Math.max(requestedLimit || 4, 1), 12);
    const currentPost = await this.postRepo.findOne({
      where: { slug },
      relations: { vehicle: true },
    });

    if (!currentPost) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    const vehicle = currentPost.vehicle;
    const price = Number(currentPost.price);
    const manufactureYear = vehicle?.manufactureYear;
    const scoreExpression = `
      CASE WHEN LOWER(vehicle."modelName") = LOWER(:modelName) THEN 50 ELSE 0 END +
      CASE WHEN LOWER(vehicle."brandName") = LOWER(:brandName) THEN 25 ELSE 0 END +
      CASE WHEN vehicle."bodyType" = :bodyType THEN 15 ELSE 0 END +
      CASE WHEN post."categoryId" = :categoryId THEN 12 ELSE 0 END +
      CASE
        WHEN :price > 0 AND ABS(post.price - :price) <= :price * 0.1 THEN 15
        WHEN :price > 0 AND ABS(post.price - :price) <= :price * 0.25 THEN 10
        WHEN :price > 0 AND ABS(post.price - :price) <= :price * 0.5 THEN 5
        ELSE 0
      END +
      CASE
        WHEN :manufactureYear > 0 AND ABS(vehicle."manufactureYear" - :manufactureYear) <= 2 THEN 8
        WHEN :manufactureYear > 0 AND ABS(vehicle."manufactureYear" - :manufactureYear) <= 5 THEN 4
        ELSE 0
      END +
      CASE WHEN post.province = :province THEN 5 ELSE 0 END +
      CASE WHEN vehicle.condition = :condition THEN 3 ELSE 0 END
    `;

    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .leftJoin(
        'user.professionalSellerProfile',
        'professionalSellerProfile',
        'professionalSellerProfile.status = :approvedSellerStatus',
        { approvedSellerStatus: 'approved' },
      )
      .addSelect([
        'user.id',
        'user.fullName',
        'user.avatar',
        'user.isVerified',
        'user.sellerType',
        'professionalSellerProfile.id',
        'professionalSellerProfile.storeName',
        'professionalSellerProfile.logoUrl',
        'professionalSellerProfile.status',
      ])
      .addSelect(scoreExpression, 'similarityScore')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('post.id != :postId', { postId: currentPost.id })
      .setParameters({
        modelName: vehicle?.modelName || '',
        brandName: vehicle?.brandName || '',
        bodyType: vehicle?.bodyType || '',
        categoryId: currentPost.categoryId,
        price: Number.isFinite(price) ? price : 0,
        manufactureYear: manufactureYear || 0,
        province: currentPost.province,
        condition: vehicle?.condition || '',
      })
      .orderBy('similarityScore', 'DESC')
      .addOrderBy('post.viewCount', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return {
      message: 'Lấy danh sách tin đăng tương tự thành công',
      data: posts,
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
    const paymentOrders = await this.listingPaymentService.findSummariesByPostIds(
      userId,
      posts.map((post) => post.id),
    );

    return {
      message: 'Lấy danh sách tin của tôi thành công',
      data: posts.map((post) => ({
        ...post,
        paymentOrder:
          paymentOrders.find((order) => order.postId === post.id) || null,
      })),
    };
  }

  async findForAdmin(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const allowedStatuses = Object.values(PostStatus);
    const allowedBodyTypes = Object.values(VehicleBodyType);
    const allowedReportFilters = ['all', 'true', 'false'];
    const allowedSorts = [
      'newest',
      'oldest',
      'most_views',
      'most_reports',
      'expiring_soon',
    ];
    const status = query.status as PostStatus | undefined;
    const displayStatus = query.displayStatus as PostStatus | undefined;
    const dateColumns: Record<string, string> = {
      createdAt: 'post.createdAt',
      approvedAt: 'post.approvedAt',
      hiddenAt: 'post.hiddenAt',
      soldAt: 'post.soldAt',
      expiredAt: 'post.expiredAt',
    };
    const dateField = query.dateField || 'createdAt';
    const dateColumn = dateColumns[dateField];
    const sort = query.sort || 'newest';
    const minPrice = this.parseAdminNumberFilter(query.minPrice, 'Gia tu');
    const maxPrice = this.parseAdminNumberFilter(query.maxPrice, 'Gia den');
    const dateFrom = this.parseAdminDateFilter(query.dateFrom, 'Tu ngay');
    const dateTo = this.parseAdminDateFilter(query.dateTo, 'Den ngay');

    if (!dateColumn) {
      throw new BadRequestException('Moc thoi gian khong hop le');
    }

    if (!allowedSorts.includes(sort)) {
      throw new BadRequestException('Sap xep khong hop le');
    }

    if (query.hasReports && !allowedReportFilters.includes(query.hasReports)) {
      throw new BadRequestException('Bo loc report khong hop le');
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('Khoang gia khong hop le');
    }

    if (
      dateFrom &&
      dateTo &&
      new Date(dateFrom).getTime() > new Date(dateTo).getTime()
    ) {
      throw new BadRequestException('Khoang thoi gian khong hop le');
    }

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .leftJoin(
        'user.professionalSellerProfile',
        'professionalSellerProfile',
        'professionalSellerProfile.status = :approvedSellerStatus',
        { approvedSellerStatus: 'approved' },
      )
      .addSelect([
        'user.id',
        'user.fullName',
        'user.avatar',
        'user.isVerified',
        'user.phone',
        'user.email',
      ]);

    const addFilter = (condition: string, params?: Record<string, unknown>) => {
      if (qb.expressionMap.wheres.length) {
        qb.andWhere(condition, params);
      } else {
        qb.where(condition, params);
      }
    };

    if (status && status !== ('all' as PostStatus)) {
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException(
          'Tráº¡ng thÃ¡i tin Ä‘Äƒng khÃ´ng há»£p lá»‡',
        );
      }
      addFilter('post.status = :status', { status });
    }

    if (displayStatus && displayStatus !== ('all' as PostStatus)) {
      if (!allowedStatuses.includes(displayStatus)) {
        throw new BadRequestException(
          'Tráº¡ng thÃ¡i hiá»ƒn thá»‹ khÃ´ng há»£p lá»‡',
        );
      }
      addFilter('post.status = :displayStatus', { displayStatus });
    }

    const trimmedKeyword = query.keyword?.trim();
    if (trimmedKeyword) {
      const keywordLike = `%${trimmedKeyword}%`;
      const normalizedPhone = trimmedKeyword.replace(/\D/g, '');
      const quickConditions = [
        'post.title ILIKE :keywordLike',
        'user.fullName ILIKE :keywordLike',
        'user.email ILIKE :keywordLike',
        'vehicle.licensePlate ILIKE :keywordLike',
      ];
      const quickParams: Record<string, unknown> = { keywordLike };

      if (/^\d+$/.test(trimmedKeyword)) {
        quickConditions.push('post.id = :postId');
        quickParams.postId = Number(trimmedKeyword);
      }

      if (normalizedPhone) {
        quickConditions.push(
          "(user.phone = :phone OR regexp_replace(COALESCE(user.phone, ''), '\\D', '', 'g') = :phone)",
        );
        quickParams.phone = normalizedPhone;
      }

      addFilter(`(${quickConditions.join(' OR ')})`, quickParams);
    }

    if (query.province) {
      addFilter('post.province ILIKE :province', {
        province: `%${query.province.trim()}%`,
      });
    }

    if (query.district) {
      addFilter('post.district ILIKE :district', {
        district: `%${query.district.trim()}%`,
      });
    }

    if (query.bodyType) {
      if (!allowedBodyTypes.includes(query.bodyType as VehicleBodyType)) {
        throw new BadRequestException('Loai xe khong hop le');
      }
      addFilter('vehicle.bodyType = :bodyType', { bodyType: query.bodyType });
    }

    if (query.brandName) {
      addFilter('vehicle.brandName ILIKE :brandName', {
        brandName: `%${query.brandName.trim()}%`,
      });
    }

    if (query.modelName) {
      addFilter('vehicle.modelName ILIKE :modelName', {
        modelName: `%${query.modelName.trim()}%`,
      });
    }

    if (minPrice !== undefined) {
      addFilter('post.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      addFilter('post.price <= :maxPrice', { maxPrice });
    }

    if (dateFrom) {
      addFilter(`${dateColumn} >= :dateFrom`, { dateFrom });
    }

    if (dateTo) {
      const normalizedDateTo =
        dateTo.length === 10 ? `${dateTo} 23:59:59.999` : dateTo;
      addFilter(`${dateColumn} <= :dateTo`, { dateTo: normalizedDateTo });
    }

    if (query.hasReports === 'true') {
      addFilter(
        'EXISTS (SELECT 1 FROM reports report WHERE report."targetId" = post.id AND report."targetType" = :targetType)',
        { targetType: TargetType.POST },
      );
    }

    if (query.hasReports === 'false') {
      addFilter(
        'NOT EXISTS (SELECT 1 FROM reports report WHERE report."targetId" = post.id AND report."targetType" = :targetType)',
        { targetType: TargetType.POST },
      );
    }

    const reportCountQuery = qb
      .subQuery()
      .select('COUNT(report.id)')
      .from(Report, 'report')
      .where('report."targetId" = post.id')
      .andWhere('report."targetType" = :reportTargetType')
      .getQuery();

    qb.setParameter('reportTargetType', TargetType.POST);

    switch (sort) {
      case 'oldest':
        qb.orderBy('post.createdAt', 'ASC');
        break;
      case 'most_views':
        qb.orderBy('post.viewCount', 'DESC').addOrderBy(
          'post.createdAt',
          'DESC',
        );
        break;
      case 'most_reports':
        qb.orderBy(reportCountQuery, 'DESC').addOrderBy(
          'post.createdAt',
          'DESC',
        );
        break;
      case 'expiring_soon':
        qb.orderBy('post.expiredAt', 'ASC', 'NULLS LAST').addOrderBy(
          'post.createdAt',
          'DESC',
        );
        break;
      default:
        qb.orderBy('post.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const reportCounts = items.length
      ? await this.reportRepo
          .createQueryBuilder('report')
          .select('report."targetId"', 'targetId')
          .addSelect('COUNT(report.id)', 'count')
          .where('report."targetType" = :targetType', {
            targetType: TargetType.POST,
          })
          .andWhere('report."targetId" IN (:...ids)', {
            ids: items.map((item) => item.id),
          })
          .groupBy('report."targetId"')
          .getRawMany<{ targetId: number; count: string }>()
      : [];
    const reportCountMap = new Map(
      reportCounts.map((item) => [Number(item.targetId), Number(item.count)]),
    );
    const itemsWithReportCount = items.map((item) => ({
      ...item,
      reportCount: reportCountMap.get(item.id) || 0,
    }));

    return {
      message: 'Láº¥y danh sÃ¡ch tin Ä‘Äƒng admin thÃ nh cÃ´ng',
      data: {
        items: itemsWithReportCount,
        total,
        page,
        limit,
      },
    };
  }

  private async findForAdminLegacy(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const allowedStatuses = Object.values(PostStatus);
    const status = query.status as PostStatus | undefined;
    const qb = this.postRepo
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
        'user.email',
      ])
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status && status !== ('all' as PostStatus)) {
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException('Trạng thái tin đăng không hợp lệ');
      }
      qb.where('post.status = :status', { status });
    }

    if (query.keyword) {
      const condition =
        '(post.title ILIKE :keyword OR post.description ILIKE :keyword OR user.fullName ILIKE :keyword OR user.email ILIKE :keyword)';
      const params = { keyword: `%${query.keyword}%` };

      if (qb.expressionMap.wheres.length) {
        qb.andWhere(condition, params);
      } else {
        qb.where(condition, params);
      }
    }

    if (query.province) {
      if (qb.expressionMap.wheres.length) {
        qb.andWhere('post.province = :province', { province: query.province });
      } else {
        qb.where('post.province = :province', { province: query.province });
      }
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Lấy danh sách tin đăng admin thành công',
      data: {
        items,
        total,
        page,
        limit,
      },
    };
  }

  async findPendingForAdmin(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const qb = this.postRepo
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
      ])
      .where('post.status = :status', { status: PostStatus.PENDING })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.keyword) {
      qb.andWhere(
        '(post.title ILIKE :keyword OR post.description ILIKE :keyword OR user.fullName ILIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    if (query.province) {
      qb.andWhere('post.province = :province', { province: query.province });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Lấy danh sách tin chờ kiểm duyệt thành công',
      data: {
        items,
        total,
        page,
        limit,
      },
    };
  }

  async findReviewForAdmin(slug: string) {
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
        'user.email',
        'user.status',
        'user.createdAt',
      ])
      .where('post.slug = :slug', { slug })
      .getOne();

    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    const paymentOrder = await this.listingPaymentService.findByPostId(post.id);

    return {
      message: 'Lấy chi tiết tin đăng thành công',
      data: { ...post, paymentOrder },
    };
  }

  async approvePost(adminId: number, id: number) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt tin đang chờ kiểm duyệt');
    }

    post.status = PostStatus.ACTIVE;
    post.approvedAt = new Date();
    post.approvedBy = adminId;
    post.rejectedReason = undefined;
    await this.postRepo.save(post);
    await this.notificationService.createNotification({
      userId: post.userId,
      title: 'Tin đăng đã được duyệt',
      content: `Tin "${post.title}" đã được duyệt và đang hiển thị công khai.`,
      type: NotificationType.POST_APPROVED,
      referenceId: post.id,
    });

    return {
      message: 'Đã duyệt tin đăng',
      data: post,
    };
  }

  async rejectPost(id: number, reason?: string) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể từ chối tin đang chờ kiểm duyệt',
      );
    }

    const rejectedReason = reason?.trim();
    if (!rejectedReason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }

    await this.dataSource.transaction(async (manager) => {
      post.status = PostStatus.REJECTED;
      post.rejectedReason = rejectedReason;
      await manager.save(post);
      await this.listingPaymentService.refundFreeQuota(manager, post);
    });
    await this.notificationService.createNotification({
      userId: post.userId,
      title: 'Tin đăng bị từ chối',
      content: `Tin "${post.title}" bị từ chối. Lý do: ${rejectedReason}`,
      type: NotificationType.POST_REJECTED,
      referenceId: post.id,
    });

    return {
      message: 'Đã từ chối tin đăng',
      data: post,
    };
  }

  async findOne(slug: string) {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.vehicle', 'vehicle')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoin('post.user', 'user')
      .leftJoin(
        'user.professionalSellerProfile',
        'professionalSellerProfile',
        'professionalSellerProfile.status = :approvedSellerStatus',
        { approvedSellerStatus: 'approved' },
      )
      .addSelect([
        'user.id',
        'user.fullName',
        'user.avatar',
        'user.isVerified',
        'user.phone',
        'user.showPhone',
        'user.sellerType',
        'professionalSellerProfile.id',
        'professionalSellerProfile.storeName',
        'professionalSellerProfile.logoUrl',
        'professionalSellerProfile.status',
      ])
      .where('post.slug = :slug', { slug })
      .andWhere('post.status != :hiddenStatus', {
        hiddenStatus: PostStatus.HIDDEN,
      })
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
          sellerType: post.user.sellerType,
          store:
            post.user.sellerType === SellerType.PROFESSIONAL &&
            post.user.professionalSellerProfile
              ? {
                  id: post.user.professionalSellerProfile.id,
                  storeName: post.user.professionalSellerProfile.storeName,
                  logoUrl: post.user.professionalSellerProfile.logoUrl,
                }
              : undefined,
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

    if (post.status === PostStatus.HIDDEN) {
      throw new BadRequestException(
        'Tin đăng đang bị ẩn, vui lòng liên hệ quản trị viên',
      );
    }

    const categoryId = updatePostDto.categoryId
      ? Number(updatePostDto.categoryId)
      : post.categoryId;

    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, status: CategoryStatus.ACTIVE },
    });
    if (!category) throw new BadRequestException('Danh mục không hợp lệ');

    const effectiveVehicleData = {
      ...(post.vehicle || {}),
      ...updatePostDto,
    } as unknown as CreatePostDto;
    this.clearUnsupportedListingFields(effectiveVehicleData, category);
    this.validateListingFields(effectiveVehicleData, category);

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
      if (post.freeQuotaRefunded) {
        const billing = await this.listingPaymentService.reserveBilling(
          manager,
          userId,
          category,
        );
        post.listingBillingType = billing.billingType;
        post.listingPricingGroup = billing.pricingGroup;
        post.listingFee = billing.amount;
        post.freeQuotaRefunded = false;
        post.status =
          billing.billingType === ListingBillingType.FREE
            ? PostStatus.PENDING
            : PostStatus.DRAFT;
      } else if (
        post.status !== PostStatus.DRAFT ||
        post.listingBillingType !== ListingBillingType.PAID
      ) {
        post.status = PostStatus.PENDING;
      }

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
      post.rejectedReason = undefined;

      await manager.save(Post, post);

      if (post.vehicle) {
        const mergedVehicleData = {
          ...effectiveVehicleData,
          bodyType: effectiveVehicleData.bodyType,
          condition: effectiveVehicleData.condition,
          fuelType: effectiveVehicleData.fuelType,
          transmission: effectiveVehicleData.transmission,
          brandName:
            effectiveVehicleData.brandName ||
            names.brandName ||
            post.vehicle.brandName,
          modelName:
            effectiveVehicleData.modelName ||
            names.modelName ||
            post.vehicle.modelName,
        };

        Object.assign(post.vehicle, {
          ...this.buildVehiclePayload(post.id, categoryId, mergedVehicleData, {
            brandId: names.brandId ?? post.vehicle.brandId,
            modelId: names.modelId ?? post.vehicle.modelId,
            brandName: mergedVehicleData.brandName,
            modelName: mergedVehicleData.modelName,
          }),
          documentImages: uploadedDocumentImages.length
            ? uploadedDocumentImages
            : post.vehicle.documentImages,
        });
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
    if (post.status === PostStatus.PENDING) {
      await this.notifyAdminsAboutPendingPost(post);
    }

    return {
      message:
        post.status === PostStatus.PENDING
          ? 'Cập nhật tin đăng thành công, vui lòng chờ kiểm duyệt'
          : 'Tin đã được cập nhật, vui lòng thanh toán phí đăng tin',
      data: post,
      paymentRequired: post.status === PostStatus.DRAFT,
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

    if (post.status === PostStatus.HIDDEN) {
      throw new BadRequestException(
        'Tin đăng đang bị ẩn, vui lòng liên hệ quản trị viên',
      );
    }

    const selectedImage = post.post_images.find(
      (image) => image.id === imageId,
    );
    if (!selectedImage) {
      throw new NotFoundException('Không tìm thấy hình ảnh');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(PostImage, { postId }, { isPrimary: false });
      await manager.update(PostImage, { id: imageId }, { isPrimary: true });
      if (
        !post.freeQuotaRefunded &&
        !(
          post.status === PostStatus.DRAFT &&
          post.listingBillingType === ListingBillingType.PAID
        )
      ) {
        post.status = PostStatus.PENDING;
        post.rejectedReason = undefined;
      }
      await manager.save(Post, post);
    });
    if (post.status === PostStatus.PENDING) {
      await this.notifyAdminsAboutPendingPost(post);
    }

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

    if (post.status === PostStatus.HIDDEN) {
      throw new BadRequestException(
        'Tin đăng đang bị ẩn, vui lòng liên hệ quản trị viên',
      );
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

      if (
        !post.freeQuotaRefunded &&
        !(
          post.status === PostStatus.DRAFT &&
          post.listingBillingType === ListingBillingType.PAID
        )
      ) {
        post.status = PostStatus.PENDING;
        post.rejectedReason = undefined;
      }
      await manager.save(Post, post);
    });
    if (post.status === PostStatus.PENDING) {
      await this.notifyAdminsAboutPendingPost(post);
    }

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

    if (post.status !== PostStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể đánh dấu đã bán với tin đang hiển thị',
      );
    }

    post.status = PostStatus.SOLD;
    post.soldAt = new Date();
    await this.postRepo.save(post);

    return {
      message: 'Tin đăng đã được đánh dấu là đã bán',
    };
  }

  async relist(userId: number, id: number) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật tin này');
    }
    if (post.status !== PostStatus.SOLD) {
      throw new BadRequestException('Chỉ có thể đăng lại tin đã bán');
    }

    post.status = PostStatus.PENDING;
    post.soldAt = undefined;
    await this.postRepo.save(post);
    await this.notifyAdminsAboutPendingPost(post);

    return {
      message: 'Tin đăng đã được gửi duyệt lại',
      data: post,
    };
  }

  private async deletePostById(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: { post_images: true, vehicle: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');

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

    return post;
  }

  async removeForAdmin(adminId: number, id: number, reason?: string) {
    const post = await this.postRepo.findOne({ where: { id } });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');

    const hiddenReason = reason?.trim();
    if (!hiddenReason) {
      throw new BadRequestException('Vui lòng nhập lý do xóa tin');
    }

    post.status = PostStatus.HIDDEN;
    post.hiddenReason = hiddenReason;
    post.hiddenAt = new Date();
    post.hiddenBy = adminId;
    await this.postRepo.save(post);

    return {
      message: 'Đã xóa tin đăng khỏi giao diện công khai',
      data: post,
    };
  }

  async restoreForAdmin(adminId: number, id: number) {
    const post = await this.postRepo.findOne({ where: { id } });

    if (!post) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y tin Ä‘Äƒng');
    if (post.status !== PostStatus.HIDDEN) {
      throw new BadRequestException(
        'Chá»‰ cÃ³ thá»ƒ khÃ´i phá»¥c tin Ä‘Ã£ xÃ³a',
      );
    }

    post.status = PostStatus.ACTIVE;
    post.approvedAt = post.approvedAt || new Date();
    post.approvedBy = post.approvedBy || adminId;
    post.hiddenReason = undefined;
    post.hiddenAt = undefined;
    post.hiddenBy = undefined;
    await this.postRepo.save(post);

    return {
      message: 'ÄÃ£ khÃ´i phá»¥c tin Ä‘Äƒng',
      data: post,
    };
  }

  async remove(userId: number, id: number) {
    const post = await this.postRepo.findOne({ where: { id } });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin này');
    }

    await this.deletePostById(id);

    return {
      message: 'Xóa tin đăng thành công',
    };
  }
}
