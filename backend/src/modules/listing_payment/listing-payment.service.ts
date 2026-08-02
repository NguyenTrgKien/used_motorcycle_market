import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { EntityManager, In, Repository } from 'typeorm';
import {
  SellerType,
  PostStatus,
  UserRole,
  NotificationType,
  ProfessionalSellerStatus,
} from 'src/shared';
import { Category } from '../category/entities/category.entity';
import { NotificationService } from '../notification/notification.service';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { ProfessionalSellerProfile } from '../professional_seller/entities/professional_seller_profile.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateListingPaymentOrderDto } from './dto/create-listing-payment-order.dto';
import { ListingFreeQuota } from './entities/listing-free-quota.entity';
import { ListingPaymentOrder } from './entities/listing-payment-order.entity';
import {
  LARGE_VEHICLE_CATEGORY_SLUGS,
  LISTING_FEE,
  ListingBillingType,
  ListingPaymentMethod,
  ListingPaymentStatus,
  ListingPricingGroup,
} from './listing-payment.types';

export interface MomoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

interface MomoCreateResponse {
  resultCode: number;
  message: string;
  payUrl?: string;
}

@Injectable()
export class ListingPaymentService {
  constructor(
    @InjectRepository(ListingPaymentOrder)
    private readonly orderRepo: Repository<ListingPaymentOrder>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private getPricingGroup(category: Category) {
    return LARGE_VEHICLE_CATEGORY_SLUGS.includes(category.slug)
      ? ListingPricingGroup.LARGE_VEHICLE
      : ListingPricingGroup.OTHER_VEHICLE;
  }

  private getFreeLimit(pricingGroup: ListingPricingGroup) {
    return pricingGroup === ListingPricingGroup.LARGE_VEHICLE ? 1 : 2;
  }

  async preview(userId: number, categoryId: number) {
    const [user, category] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.categoryRepo.findOne({ where: { id: categoryId } }),
    ]);

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    const professionalProfile = await this.orderRepo.manager.findOne(
      ProfessionalSellerProfile,
      { where: { userId } },
    );
    if (professionalProfile?.status === ProfessionalSellerStatus.SUSPENDED) {
      throw new BadRequestException('Hồ sơ người bán chuyên đang bị đình chỉ');
    }

    const pricingGroup = this.getPricingGroup(category);
    const freeLimit =
      user.sellerType === SellerType.PROFESSIONAL
        ? 0
        : this.getFreeLimit(pricingGroup);
    const quota = await this.orderRepo.manager.findOne(ListingFreeQuota, {
      where: { userId, pricingGroup },
    });
    const freeUsed = quota?.usedCount || 0;
    const isFree = freeUsed < freeLimit;

    return {
      data: {
        categoryId,
        pricingGroup,
        sellerType: user.sellerType,
        freeLimit,
        freeUsed,
        freeRemaining: Math.max(freeLimit - freeUsed, 0),
        billingType: isFree ? ListingBillingType.FREE : ListingBillingType.PAID,
        amount: isFree ? 0 : LISTING_FEE,
      },
    };
  }

  async reserveBilling(
    manager: EntityManager,
    userId: number,
    category: Category,
  ) {
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const professionalProfile = await manager.findOne(
      ProfessionalSellerProfile,
      { where: { userId } },
    );
    if (professionalProfile?.status === ProfessionalSellerStatus.SUSPENDED) {
      throw new BadRequestException('Hồ sơ người bán chuyên đang bị đình chỉ');
    }

    const pricingGroup = this.getPricingGroup(category);
    if (user.sellerType === SellerType.PROFESSIONAL) {
      return {
        billingType: ListingBillingType.PAID,
        pricingGroup,
        amount: LISTING_FEE,
      };
    }

    await manager
      .createQueryBuilder()
      .insert()
      .into(ListingFreeQuota)
      .values({ userId, pricingGroup, usedCount: 0 })
      .orIgnore()
      .execute();

    const quota = await manager.findOne(ListingFreeQuota, {
      where: { userId, pricingGroup },
      lock: { mode: 'pessimistic_write' },
    });
    const freeLimit = this.getFreeLimit(pricingGroup);

    if (quota && quota.usedCount < freeLimit) {
      quota.usedCount += 1;
      await manager.save(quota);
      return {
        billingType: ListingBillingType.FREE,
        pricingGroup,
        amount: 0,
      };
    }

    return {
      billingType: ListingBillingType.PAID,
      pricingGroup,
      amount: LISTING_FEE,
    };
  }

  async refundFreeQuota(manager: EntityManager, post: Post) {
    if (
      post.listingBillingType !== ListingBillingType.FREE ||
      !post.listingPricingGroup ||
      post.freeQuotaRefunded
    ) {
      return;
    }

    const quota = await manager.findOne(ListingFreeQuota, {
      where: {
        userId: post.userId,
        pricingGroup: post.listingPricingGroup,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (quota && quota.usedCount > 0) {
      quota.usedCount -= 1;
      await manager.save(quota);
    }

    post.freeQuotaRefunded = true;
    await manager.save(post);
  }

  private createOrderCode() {
    return `LIST${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
  }

  async createOrder(
    userId: number,
    dto: CreateListingPaymentOrderDto,
    ipAddress: string,
  ) {
    const post = await this.postRepo.findOne({
      where: { id: dto.postId, userId },
    });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (
      post.status !== PostStatus.DRAFT ||
      post.listingBillingType !== ListingBillingType.PAID
    ) {
      throw new BadRequestException('Tin đăng này không cần thanh toán');
    }

    let order = await this.orderRepo.findOne({ where: { postId: post.id } });
    if (order?.status === ListingPaymentStatus.PAID) {
      return { data: order };
    }
    if (
      order?.status === ListingPaymentStatus.PENDING &&
      order.method === ListingPaymentMethod.BANK_TRANSFER &&
      order.transferSubmittedAt
    ) {
      throw new BadRequestException(
        'Biên lai đã được gửi và đang chờ quản trị viên xác nhận',
      );
    }

    if (!order) {
      order = this.orderRepo.create({
        code: this.createOrderCode(),
        userId,
        postId: post.id,
        amount: LISTING_FEE,
        method: dto.method,
        status: ListingPaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    } else {
      const isRetryingRejectedBankTransfer =
        order.status === ListingPaymentStatus.REJECTED &&
        dto.method === ListingPaymentMethod.BANK_TRANSFER;
      order.method = dto.method;
      order.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      if (!isRetryingRejectedBankTransfer) {
        order.status = ListingPaymentStatus.PENDING;
      }
      if (order.rejectedAt && !isRetryingRejectedBankTransfer) {
        order.receiptUrl = null;
        order.receiptPublicId = null;
        order.transferSubmittedAt = null;
        order.rejectedReason = null;
        order.rejectedAt = null;
        order.rejectedBy = null;
      }
    }

    order = await this.orderRepo.save(order);

    if (dto.method === ListingPaymentMethod.VNPAY) {
      return {
        data: order,
        paymentUrl: this.createVnpayUrl(order, ipAddress),
      };
    }

    if (dto.method === ListingPaymentMethod.MOMO) {
      return {
        data: order,
        paymentUrl: await this.createMomoUrl(order),
      };
    }

    const bankName = this.configService.get<string>('BANK_NAME') || '';
    const accountNumber =
      this.configService.get<string>('BANK_ACCOUNT_NUMBER') || '';
    const accountName =
      this.configService.get<string>('BANK_ACCOUNT_NAME') || '';
    const bankBin = this.configService.get<string>('BANK_BIN') || '';
    if (
      !bankName ||
      !/^\d{6}$/.test(bankBin) ||
      !/^\d{6,19}$/.test(accountNumber) ||
      !accountName
    ) {
      throw new BadRequestException(
        'Chuyển khoản ngân hàng chưa được cấu hình',
      );
    }

    const qrImageUrl = new URL(
      `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png`,
    );
    qrImageUrl.searchParams.set('amount', String(order.amount));
    qrImageUrl.searchParams.set('addInfo', order.code);
    qrImageUrl.searchParams.set('accountName', accountName);

    return {
      data: order,
      bankTransfer: {
        bankName,
        accountNumber,
        accountName,
        amount: order.amount,
        content: order.code,
        qrImageUrl: qrImageUrl.toString(),
        expiresAt: order.expiresAt,
      },
    };
  }

  private formatVnpayDate(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(/\D/g, '');
  }

  private encodeVnpay(value: string) {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private createVnpayUrl(order: ListingPaymentOrder, ipAddress: string) {
    const paymentUrl =
      this.configService.get<string>('VNPAY_PAYMENT_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    const hashSecret =
      this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || '';
    if (!tmnCode || !hashSecret || !returnUrl) {
      throw new BadRequestException('VNPay chưa được cấu hình');
    }
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(order.amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: order.code,
      vnp_OrderInfo: `Thanh toan phi dang tin ${order.code}`,
      vnp_OrderType: '240000',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddress || '127.0.0.1',
      vnp_CreateDate: this.formatVnpayDate(new Date()),
      vnp_ExpireDate: this.formatVnpayDate(order.expiresAt),
    };
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .map((key) => `${this.encodeVnpay(key)}=${this.encodeVnpay(params[key])}`)
      .join('&');
    const signature = createHmac('sha512', hashSecret)
      .update(signData)
      .digest('hex');

    return `${paymentUrl}?${signData}&vnp_SecureHash=${signature}`;
  }

  private async createMomoUrl(order: ListingPaymentOrder) {
    const endpoint =
      this.configService.get<string>('MOMO_PAYMENT_URL') ||
      'https://test-payment.momo.vn/v2/gateway/api/create';
    const partnerCode =
      this.configService.get<string>('MOMO_PARTNER_CODE') || '';
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    const redirectUrl =
      this.configService.get<string>('MOMO_REDIRECT_URL') || '';
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL') || '';
    const requestId = order.code;
    const orderId = order.code;
    const orderInfo = `Thanh toan phi dang tin ${order.code}`;
    const requestType = 'captureWallet';
    const extraData = '';
    if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
      throw new BadRequestException('MoMo chưa được cấu hình');
    }
    const rawSignature =
      `accessKey=${accessKey}&amount=${order.amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;
    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
    const response = await axios.post<MomoCreateResponse>(endpoint, {
      partnerCode,
      requestId,
      amount: order.amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      lang: 'vi',
      signature,
    });

    if (response.data.resultCode !== 0 || !response.data.payUrl) {
      throw new BadRequestException(
        response.data.message || 'Không thể tạo thanh toán MoMo',
      );
    }

    return response.data.payUrl;
  }

  private safeCompare(first: string, second: string) {
    const firstBuffer = Buffer.from(first);
    const secondBuffer = Buffer.from(second);
    return (
      firstBuffer.length === secondBuffer.length &&
      timingSafeEqual(firstBuffer, secondBuffer)
    );
  }

  private verifyVnpaySignature(params: Record<string, string>) {
    const receivedHash = params.vnp_SecureHash || '';
    const filtered = Object.fromEntries(
      Object.entries(params).filter(
        ([key]) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType',
      ),
    );
    const signData = Object.keys(filtered)
      .sort()
      .map(
        (key) =>
          `${this.encodeVnpay(key)}=${this.encodeVnpay(filtered[key] || '')}`,
      )
      .join('&');
    const expectedHash = createHmac(
      'sha512',
      this.configService.get<string>('VNPAY_HASH_SECRET') || '',
    )
      .update(signData)
      .digest('hex');
    return this.safeCompare(receivedHash, expectedHash);
  }

  async handleVnpayResult(params: Record<string, string>) {
    if (!this.verifyVnpaySignature(params)) {
      return { code: '97', message: 'Invalid signature' };
    }
    if (
      params.vnp_TmnCode !==
      (this.configService.get<string>('VNPAY_TMN_CODE') || '')
    ) {
      return { code: '97', message: 'Invalid merchant' };
    }

    const order = await this.orderRepo.findOne({
      where: { code: params.vnp_TxnRef },
    });
    if (!order) return { code: '01', message: 'Order not found' };
    if (Number(params.vnp_Amount) !== order.amount * 100) {
      return { code: '04', message: 'Invalid amount' };
    }
    if (order.status === ListingPaymentStatus.PAID) {
      return { code: '02', message: 'Order already confirmed' };
    }

    if (
      params.vnp_ResponseCode === '00' &&
      params.vnp_TransactionStatus === '00'
    ) {
      await this.markPaid(
        order,
        params.vnp_TransactionNo,
        params as Record<string, unknown>,
      );
      return { code: '00', message: 'Confirm success' };
    }

    order.status = ListingPaymentStatus.FAILED;
    order.gatewayResponse = params;
    await this.orderRepo.save(order);
    return { code: '00', message: 'Confirm success' };
  }

  private verifyMomoSignature(payload: MomoIpnPayload) {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    const rawSignature =
      `accessKey=${accessKey}&amount=${payload.amount}` +
      `&extraData=${payload.extraData}&message=${payload.message}` +
      `&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}` +
      `&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}` +
      `&payType=${payload.payType}&requestId=${payload.requestId}` +
      `&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}` +
      `&transId=${payload.transId}`;
    const expected = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
    return this.safeCompare(payload.signature, expected);
  }

  async handleMomoIpn(payload: MomoIpnPayload) {
    if (!this.verifyMomoSignature(payload)) {
      throw new BadRequestException('Chữ ký MoMo không hợp lệ');
    }
    if (
      payload.partnerCode !==
      (this.configService.get<string>('MOMO_PARTNER_CODE') || '')
    ) {
      throw new BadRequestException('Mã đối tác MoMo không hợp lệ');
    }
    const order = await this.orderRepo.findOne({
      where: { code: payload.orderId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    if (payload.amount !== order.amount || payload.requestId !== order.code) {
      throw new BadRequestException('Số tiền MoMo không hợp lệ');
    }

    if (
      payload.resultCode === 0 &&
      order.status !== ListingPaymentStatus.PAID
    ) {
      await this.markPaid(
        order,
        String(payload.transId),
        payload as unknown as Record<string, unknown>,
      );
    } else if (payload.resultCode !== 0) {
      order.status = ListingPaymentStatus.FAILED;
      order.gatewayResponse = payload as unknown as Record<string, unknown>;
      await this.orderRepo.save(order);
    }
  }

  async confirmBankTransfer(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    if (order.method !== ListingPaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Đơn này không phải chuyển khoản');
    }
    if (!order.receiptUrl || !order.transferSubmittedAt) {
      throw new BadRequestException(
        'Người dùng chưa gửi biên lai chuyển khoản',
      );
    }
    if (order.status !== ListingPaymentStatus.PAID) {
      await this.markPaid(order, `BANK-${order.code}`, {
        confirmedManually: true,
      });
      const post = await this.postRepo.findOne({
        where: { id: order.postId },
        select: { id: true, title: true },
      });
      await this.notificationService.createNotification({
        userId: order.userId,
        title: 'Thanh toán chuyển khoản đã được xác nhận',
        content: post
          ? `Thanh toán cho tin "${post.title}" đã được xác nhận. Tin đang chờ kiểm duyệt.`
          : `Giao dịch ${order.code} đã được xác nhận. Tin đăng đang chờ kiểm duyệt.`,
        type: NotificationType.BANK_TRANSFER_CONFIRMED,
        referenceId: order.postId,
      });
    }
    return { message: 'Đã xác nhận chuyển khoản', data: order };
  }

  async submitBankTransfer(
    userId: number,
    orderId: string,
    receipt?: Express.Multer.File,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    if (order.method !== ListingPaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Đơn này không phải chuyển khoản');
    }
    if (
      order.status !== ListingPaymentStatus.PENDING &&
      order.status !== ListingPaymentStatus.REJECTED
    ) {
      throw new BadRequestException('Đơn thanh toán không còn chờ xác nhận');
    }
    if (!receipt) {
      throw new BadRequestException('Vui lòng chọn ảnh biên lai giao dịch');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(receipt.mimetype)) {
      throw new BadRequestException('Biên lai phải là ảnh JPG, PNG hoặc WEBP');
    }
    if (receipt.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ảnh biên lai không được vượt quá 5MB');
    }

    const isRejectedRetry = order.status === ListingPaymentStatus.REJECTED;
    const previousPublicId = isRejectedRetry ? null : order.receiptPublicId;
    const uploaded = await this.cloudinaryService.uploadSingleFile(receipt);
    order.status = ListingPaymentStatus.PENDING;
    order.receiptUrl = uploaded.url;
    order.receiptPublicId = uploaded.publicId;
    order.transferSubmittedAt = new Date();
    order.rejectedReason = null;
    order.rejectedAt = null;
    order.rejectedBy = null;
    await this.orderRepo.save(order);

    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          userId: admin.id,
          title: 'Có giao dịch chuyển khoản chờ xác nhận',
          content: `Người dùng đã gửi biên lai cho giao dịch ${order.code} với số tiền ${order.amount.toLocaleString('vi-VN')}đ.`,
          type: NotificationType.BANK_TRANSFER_SUBMITTED,
          referenceId: order.postId,
        }),
      ),
    );

    if (previousPublicId && previousPublicId !== uploaded.publicId) {
      await this.cloudinaryService
        .deleteFile(previousPublicId)
        .catch(() => undefined);
    }

    return {
      message: 'Đã gửi biên lai, giao dịch đang chờ quản trị viên xác nhận',
      data: order,
    };
  }

  async rejectBankTransfer(orderId: string, adminId: number, reason: string) {
    const rejectedReason = reason.trim();
    if (rejectedReason.length < 3) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    if (order.method !== ListingPaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Đơn này không phải chuyển khoản');
    }
    if (order.status !== ListingPaymentStatus.PENDING) {
      throw new BadRequestException('Đơn thanh toán không còn chờ xác nhận');
    }
    if (!order.receiptUrl || !order.transferSubmittedAt) {
      throw new BadRequestException(
        'Người dùng chưa gửi biên lai chuyển khoản',
      );
    }

    const rejectedAt = new Date();
    order.status = ListingPaymentStatus.REJECTED;
    order.rejectedReason = rejectedReason;
    order.rejectedAt = rejectedAt;
    order.rejectedBy = adminId;
    order.rejectionHistory = [
      ...(order.rejectionHistory || []),
      {
        reason: rejectedReason,
        rejectedAt: rejectedAt.toISOString(),
        rejectedBy: adminId,
        receiptUrl: order.receiptUrl,
      },
    ];
    await this.orderRepo.save(order);

    await this.notificationService.createNotification({
      userId: order.userId,
      title: 'Biên lai chuyển khoản bị từ chối',
      content: `Giao dịch ${order.code} bị từ chối. Lý do: ${rejectedReason}`,
      type: NotificationType.BANK_TRANSFER_REJECTED,
      referenceId: order.postId,
    });

    return { message: 'Đã từ chối giao dịch chuyển khoản', data: order };
  }

  async findForAdmin() {
    const orders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
    const postIds = orders.map((order) => order.postId);
    const userIds = orders.map((order) => order.userId);
    const posts = postIds.length
      ? await this.postRepo
          .createQueryBuilder('post')
          .select(['post.id', 'post.title', 'post.slug'])
          .where('post.id IN (:...postIds)', { postIds })
          .getMany()
      : [];
    const users = userIds.length
      ? await this.userRepo
          .createQueryBuilder('user')
          .select(['user.id', 'user.fullName', 'user.email'])
          .where('user.id IN (:...userIds)', { userIds })
          .getMany()
      : [];

    return {
      data: orders.map((order) => ({
        ...order,
        post: posts.find((post) => post.id === order.postId),
        user: users.find((user) => user.id === order.userId),
      })),
    };
  }

  findByPostId(postId: number) {
    return this.orderRepo.findOne({ where: { postId } });
  }

  private async markPaid(
    order: ListingPaymentOrder,
    transactionId: string,
    gatewayResponse: Record<string, unknown>,
  ) {
    await this.orderRepo.manager.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(ListingPaymentOrder, {
        where: { id: order.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder || lockedOrder.status === ListingPaymentStatus.PAID) {
        return;
      }

      const post = await manager.findOne(Post, {
        where: { id: lockedOrder.postId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!post) throw new NotFoundException('Không tìm thấy tin đăng');

      lockedOrder.status = ListingPaymentStatus.PAID;
      lockedOrder.gatewayTransactionId = transactionId;
      lockedOrder.gatewayResponse = gatewayResponse;
      lockedOrder.paidAt = new Date();
      post.status = PostStatus.PENDING;
      await manager.save(lockedOrder);
      await manager.save(post);
    });

    const post = await this.postRepo.findOne({ where: { id: order.postId } });
    if (post) await this.notifyStaff(post);
  }

  private async notifyStaff(post: Post) {
    const staff = await this.userRepo.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.MODERATOR }],
      select: { id: true },
    });
    await Promise.all(
      staff.map((user) =>
        this.notificationService.createNotification({
          userId: user.id,
          title: 'Có tin đăng mới chờ duyệt',
          content: `Tin "${post.title}" đã thanh toán và đang chờ kiểm duyệt.`,
          type: NotificationType.NEW_POST_PENDING,
          referenceId: post.id,
        }),
      ),
    );
  }

  async findMine(userId: number, id: string) {
    const order = await this.orderRepo.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    return { data: order };
  }

  async findSummariesByPostIds(userId: number, postIds: number[]) {
    if (!postIds.length) return [];
    return this.orderRepo.find({
      where: { userId, postId: In(postIds) },
      select: {
        id: true,
        postId: true,
        method: true,
        status: true,
        transferSubmittedAt: true,
        receiptUrl: true,
        rejectedReason: true,
        rejectedAt: true,
      },
    });
  }
}
