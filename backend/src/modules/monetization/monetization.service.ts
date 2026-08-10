import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { NotificationType, PostStatus, SellerType } from 'src/shared';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';
import { ListingPaymentOrder } from '../listing_payment/entities/listing-payment-order.entity';
import {
  ListingPricingGroup,
  MonetizationProductType,
  SellerAudience,
} from '../listing_payment/listing-payment.types';
import { PricingPlan } from './entities/pricing-plan.entity';
import { PostBoost } from './entities/post-boost.entity';
import { SellerSubscriptionPlan } from './entities/seller-subscription-plan.entity';
import { SellerSubscription } from './entities/seller-subscription.entity';
import { SavePricingPlanDto } from './dto/save-pricing-plan.dto';
import { SaveSubscriptionPlanDto } from './dto/save-subscription-plan.dto';
import { MonetizationAuditLog } from './entities/monetization-audit-log.entity';
import { BoostCampaign } from './entities/boost-campaign.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MonetizationService {
  constructor(
    @InjectRepository(PricingPlan)
    private readonly pricingRepo: Repository<PricingPlan>,
    @InjectRepository(PostBoost)
    private readonly boostRepo: Repository<PostBoost>,
    @InjectRepository(BoostCampaign)
    private readonly campaignRepo: Repository<BoostCampaign>,
    @InjectRepository(SellerSubscriptionPlan)
    private readonly subscriptionPlanRepo: Repository<SellerSubscriptionPlan>,
    @InjectRepository(SellerSubscription)
    private readonly subscriptionRepo: Repository<SellerSubscription>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(MonetizationAuditLog)
    private readonly auditRepo: Repository<MonetizationAuditLog>,
    private readonly notificationService: NotificationService,
  ) {}

  findPricingPlanById(planId?: number) {
    return planId ? this.pricingRepo.findOne({ where: { id: planId } }) : null;
  }

  async findPricingPlansByIds(ids: number[]): Promise<PricingPlan[]> {
    return ids.length ? this.pricingRepo.find({ where: { id: In(ids) } }) : [];
  }

  async findSubscriptionPlansByIds(
    ids: number[],
  ): Promise<SellerSubscriptionPlan[]> {
    return ids.length
      ? this.subscriptionPlanRepo.find({ where: { id: In(ids) } })
      : [];
  }

  async getMyBoostCampaigns(userId: number, postId?: number) {
    const [campaigns, subscriptionBoosts] = await Promise.all([
      this.campaignRepo.find({
        where: { userId, ...(postId ? { postId } : {}) },
        order: { updatedAt: 'DESC' },
      }),
      this.boostRepo.find({
        where: {
          userId,
          ...(postId ? { postId } : {}),
          price: 0,
          campaignId: IsNull(),
        },
        order: { boostedAt: 'DESC' },
      }),
    ]);
    const planIds = [
      ...new Set(campaigns.map((campaign) => campaign.pricingPlanId)),
    ];
    const plans = planIds.length
      ? await this.pricingRepo
          .createQueryBuilder('plan')
          .where('plan.id IN (:...planIds)', { planIds })
          .getMany()
      : [];
    const campaignItems = campaigns.map((campaign) => ({
        ...campaign,
        planName: plans.find((plan) => plan.id === campaign.pricingPlanId)
          ?.name,
        expectedEndAt: new Date(
          campaign.startedAt.getTime() +
            Math.max(campaign.totalBoosts - 1, 0) * 86400000,
        ),
      }));
    const subscriptionItems = subscriptionBoosts.map((boost) => ({
      id: -boost.id,
      postId: boost.postId,
      userId: boost.userId,
      planName: 'Lượt đẩy trong gói người bán',
      totalBoosts: 1,
      boostsCompleted: 1,
      startedAt: boost.boostedAt,
      nextBoostAt: null,
      expectedEndAt: boost.boostedAt,
      status: 'completed',
      createdAt: boost.createdAt,
      updatedAt: boost.createdAt,
    }));

    return {
      data: [...campaignItems, ...subscriptionItems].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
    };
  }

  async getPlans(userId?: number, postId?: number) {
    const user = userId
      ? await this.userRepo.findOne({ where: { id: userId } })
      : null;
    const post = postId
      ? await this.postRepo.findOne({ where: { id: postId } })
      : null;
    const audience =
      user?.sellerType === SellerType.PROFESSIONAL
        ? SellerAudience.PROFESSIONAL
        : SellerAudience.INDIVIDUAL;
    const plans = await this.pricingRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
    return {
      data: plans.filter(
        (plan) =>
          (plan.sellerAudience === SellerAudience.ALL ||
            plan.sellerAudience === audience) &&
          (!plan.categoryId || plan.categoryId === post?.categoryId),
      ),
    };
  }

  getPricingPlansAdmin() {
    return this.pricingRepo
      .find({ order: { productType: 'ASC', price: 'ASC' } })
      .then((data) => ({ data }));
  }

  async savePricingPlan(dto: SavePricingPlanDto, id?: number, adminId = 0) {
    const current = id
      ? await this.pricingRepo.findOne({ where: { id } })
      : null;
    if (id && !current) throw new NotFoundException('Không tìm thấy bảng giá');
    const plan = this.pricingRepo.create({
      ...current,
      ...dto,
      boostCredits: dto.boostCredits || 0,
    });
    const saved = await this.pricingRepo.save(plan);
    await this.auditRepo.save(
      this.auditRepo.create({
        adminId,
        action: id ? 'update' : 'create',
        entityType: 'pricing_plan',
        entityId: saved.id,
        before: current ? { ...current } : undefined,
        after: { ...saved },
      }),
    );
    return { data: saved };
  }

  async removePricingPlan(id: number, adminId = 0) {
    const current = await this.pricingRepo.findOne({ where: { id } });
    await this.pricingRepo.update(id, { isActive: false });
    await this.auditRepo.save(
      this.auditRepo.create({
        adminId,
        action: 'disable',
        entityType: 'pricing_plan',
        entityId: id,
        before: current ? { ...current } : undefined,
        after: { isActive: false },
      }),
    );
    return { message: 'Đã ngừng áp dụng bảng giá' };
  }

  async findListingPrice(
    categoryId: number,
    pricingGroup: ListingPricingGroup,
    sellerType: SellerType,
  ) {
    const audience =
      sellerType === SellerType.PROFESSIONAL
        ? SellerAudience.PROFESSIONAL
        : SellerAudience.INDIVIDUAL;
    const plans = await this.pricingRepo.find({
      where: { productType: MonetizationProductType.LISTING, isActive: true },
    });
    const matches = plans.filter(
      (plan) =>
        (plan.sellerAudience === SellerAudience.ALL ||
          plan.sellerAudience === audience) &&
        (!plan.categoryId || plan.categoryId === categoryId) &&
        (!plan.pricingGroup || plan.pricingGroup === pricingGroup),
    );
    matches.sort(
      (a, b) =>
        Number(Boolean(b.categoryId)) - Number(Boolean(a.categoryId)) ||
        Number(Boolean(b.pricingGroup)) - Number(Boolean(a.pricingGroup)),
    );
    return matches[0]?.price ?? 30000;
  }

  async resolveProduct(userId: number, planId: number, postId?: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const plan = await this.pricingRepo.findOne({
      where: { id: planId, isActive: true },
    });
    if (!user || !plan) throw new NotFoundException('Không tìm thấy sản phẩm');
    const audience =
      user.sellerType === SellerType.PROFESSIONAL
        ? SellerAudience.PROFESSIONAL
        : SellerAudience.INDIVIDUAL;
    if (
      plan.sellerAudience !== SellerAudience.ALL &&
      plan.sellerAudience !== audience
    )
      throw new BadRequestException('Gói không áp dụng cho tài khoản này');
    let post: Post | null = null;
    if (plan.productType !== MonetizationProductType.SUBSCRIPTION) {
      post = await this.postRepo.findOne({ where: { id: postId, userId } });
      if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
      if (plan.categoryId && plan.categoryId !== post.categoryId)
        throw new BadRequestException('Gói không áp dụng cho danh mục này');
      if (
        plan.productType === MonetizationProductType.BOOST &&
        post.status !== PostStatus.ACTIVE
      )
        throw new BadRequestException('Chỉ được đẩy tin đang hoạt động');
      if (
        [
          MonetizationProductType.FEATURED,
          MonetizationProductType.VIP,
        ].includes(plan.productType) &&
        ![PostStatus.PENDING, PostStatus.ACTIVE].includes(post.status)
      )
        throw new BadRequestException('Tin chưa đủ điều kiện nâng cấp');
      if (
        plan.productType === MonetizationProductType.BOOST &&
        post.lastBoostedAt &&
        Date.now() - post.lastBoostedAt.getTime() < 6 * 60 * 60 * 1000
      )
        throw new BadRequestException('Tin chỉ được đẩy lại sau 6 giờ');
    }
    if (plan.productType === MonetizationProductType.BOOST && post) {
      const activeCampaign = await this.campaignRepo.findOne({
        where: { postId: post.id, status: 'active' },
      });
      if (activeCampaign)
        throw new BadRequestException('Tin đang có gói đẩy tin hoạt động');
    }
    return { plan, post };
  }

  async fulfill(manager: EntityManager, order: ListingPaymentOrder) {
    if (order.orderType === MonetizationProductType.LISTING) {
      const post = await manager.findOne(Post, {
        where: { id: order.postId! },
        lock: { mode: 'pessimistic_write' },
      });
      if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
      post.status = PostStatus.PENDING;
      await manager.save(post);
      return post;
    }
    const plan = await manager.findOne(PricingPlan, {
      where: { id: order.pricingPlanId! },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (order.orderType === MonetizationProductType.SUBSCRIPTION) return null;
    const post = await manager.findOne(Post, {
      where: { id: order.postId! },
      lock: { mode: 'pessimistic_write' },
    });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    const now = new Date();
    if (order.orderType === MonetizationProductType.BOOST) {
      post.lastBoostedAt = now;
      const totalBoosts = plan.durationDays || 1;
      const campaign = await manager.save(
        BoostCampaign,
        manager.create(BoostCampaign, {
          postId: post.id,
          userId: order.userId,
          orderId: order.id,
          pricingPlanId: plan.id,
          totalBoosts,
          boostsCompleted: 1,
          startedAt: now,
          nextBoostAt:
            totalBoosts > 1 ? new Date(now.getTime() + 86400000) : null,
          status: totalBoosts > 1 ? 'active' : 'completed',
        }),
      );
      await manager.save(
        PostBoost,
        manager.create(PostBoost, {
          postId: post.id,
          userId: order.userId,
          orderId: order.id,
          campaignId: campaign.id,
          price: order.amount,
          boostedAt: now,
        }),
      );
    } else {
      post.promotionType = order.orderType;
      post.promotionStartedAt = now;
      post.promotionExpiredAt = new Date(
        now.getTime() + (plan.durationDays || 7) * 86400000,
      );
    }
    await manager.save(post);
    return post;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledBoosts() {
    const dueCampaigns = await this.campaignRepo
      .createQueryBuilder('campaign')
      .select('campaign.id')
      .where('campaign.status = :status', { status: 'active' })
      .andWhere('campaign.nextBoostAt <= :now', { now: new Date() })
      .orderBy('campaign.nextBoostAt', 'ASC')
      .take(100)
      .getMany();
    for (const dueCampaign of dueCampaigns) {
      const event = await this.campaignRepo.manager.transaction(
        async (manager) => {
          const campaign = await manager.findOne(BoostCampaign, {
            where: { id: dueCampaign.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (
            !campaign ||
            campaign.status !== 'active' ||
            !campaign.nextBoostAt ||
            campaign.nextBoostAt > new Date()
          )
            return null;
          const post = await manager.findOne(Post, {
            where: { id: campaign.postId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!post || post.status !== PostStatus.ACTIVE) {
            campaign.status = 'cancelled';
            campaign.nextBoostAt = null;
            await manager.save(campaign);
            return { campaign, postTitle: post?.title, status: 'cancelled' };
          }
          const boostedAt = new Date();
          post.lastBoostedAt = boostedAt;
          campaign.boostsCompleted += 1;
          if (campaign.boostsCompleted >= campaign.totalBoosts) {
            campaign.status = 'completed';
            campaign.nextBoostAt = null;
          } else {
            campaign.nextBoostAt = new Date(boostedAt.getTime() + 86400000);
          }
          await manager.save(post);
          await manager.save(campaign);
          await manager.save(
            PostBoost,
            manager.create(PostBoost, {
              postId: post.id,
              userId: campaign.userId,
              orderId: campaign.orderId,
              campaignId: campaign.id,
              price: 0,
              boostedAt,
            }),
          );
          return campaign.status === 'completed'
            ? { campaign, postTitle: post.title, status: 'completed' }
            : null;
        },
      );
      if (event) {
        await this.notificationService.createNotification({
          userId: event.campaign.userId,
          title:
            event.status === 'completed'
              ? 'Gói đẩy tin đã hoàn thành'
              : 'Gói đẩy tin đã bị hủy',
          content:
            event.status === 'completed'
              ? `Gói đẩy tin cho tin "${event.postTitle || `#${event.campaign.postId}`}" đã hoàn thành ${event.campaign.totalBoosts} lượt đẩy.`
              : `Gói đẩy tin cho tin "${event.postTitle || `#${event.campaign.postId}`}" đã bị hủy vì tin không còn hoạt động.`,
          type: NotificationType.BANK_TRANSFER_CONFIRMED,
          referenceId: event.campaign.postId,
        });
      }
    }
  }

  getSubscriptionPlans() {
    return this.subscriptionPlanRepo
      .find({ where: { isActive: true }, order: { price: 'ASC' } })
      .then((data) => ({ data }));
  }

  getSubscriptionPlansAdmin() {
    return this.subscriptionPlanRepo
      .find({ order: { price: 'ASC' } })
      .then((data) => ({ data }));
  }

  async saveSubscriptionPlan(dto: SaveSubscriptionPlanDto, id?: number) {
    const current = id
      ? await this.subscriptionPlanRepo.findOne({ where: { id } })
      : null;
    if (id && !current) throw new NotFoundException('Không tìm thấy gói tháng');
    return {
      data: await this.subscriptionPlanRepo.save(
        this.subscriptionPlanRepo.create({ ...current, ...dto }),
      ),
    };
  }

  async getMySubscription(userId: number) {
    const subscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndMapOne(
        'subscription.plan',
        SellerSubscriptionPlan,
        'plan',
        'plan.id = subscription.planId',
      )
      .where('subscription.userId = :userId', { userId })
      .andWhere('subscription.isActive = true')
      .andWhere('subscription.expiresAt > :now', { now: new Date() })
      .orderBy('subscription.expiresAt', 'DESC')
      .getOne();
    return { data: subscription };
  }

  async consumeListingAllowance(manager: EntityManager, userId: number) {
    const subscription = await manager
      .createQueryBuilder(SellerSubscription, 'subscription')
      .setLock('pessimistic_write')
      .where('subscription.userId = :userId', { userId })
      .andWhere('subscription.isActive = true')
      .andWhere('subscription.expiresAt > :now', { now: new Date() })
      .orderBy('subscription.expiresAt', 'DESC')
      .getOne();
    if (!subscription) return false;
    const plan = await manager.findOne(SellerSubscriptionPlan, {
      where: { id: subscription.planId },
    });
    if (!plan || subscription.listingsUsed >= plan.listingLimit) return false;
    subscription.listingsUsed += 1;
    await manager.save(subscription);
    return true;
  }

  async boostWithSubscription(userId: number, postId: number) {
    await this.subscriptionRepo.manager.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!post || post.status !== PostStatus.ACTIVE)
        throw new BadRequestException('Chỉ được đẩy tin đang hoạt động');
      if (
        post.lastBoostedAt &&
        Date.now() - post.lastBoostedAt.getTime() < 6 * 60 * 60 * 1000
      )
        throw new BadRequestException('Tin chỉ được đẩy lại sau 6 giờ');
      const subscription = await manager
        .createQueryBuilder(SellerSubscription, 'subscription')
        .setLock('pessimistic_write')
        .where('subscription.userId = :userId', { userId })
        .andWhere('subscription.isActive = true')
        .andWhere('subscription.expiresAt > :now', { now: new Date() })
        .orderBy('subscription.expiresAt', 'DESC')
        .getOne();
      if (!subscription)
        throw new BadRequestException('Không có gói tháng đang hoạt động');
      const plan = await manager.findOne(SellerSubscriptionPlan, {
        where: { id: subscription.planId },
      });
      if (!plan || subscription.boostsUsed >= plan.boostCredits)
        throw new BadRequestException('Đã sử dụng hết lượt đẩy trong gói');
      subscription.boostsUsed += 1;
      post.lastBoostedAt = new Date();
      await manager.save(subscription);
      await manager.save(post);
      await manager.save(
        PostBoost,
        manager.create(PostBoost, {
          postId,
          userId,
          price: 0,
          boostedAt: post.lastBoostedAt,
        }),
      );
    });
    return { message: 'Đã đẩy tin bằng lượt trong gói tháng' };
  }

  async resolveSubscription(userId: number, planId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.sellerType !== SellerType.PROFESSIONAL)
      throw new BadRequestException(
        'Chỉ người bán chuyên nghiệp được đăng ký gói tháng',
      );
    const plan = await this.subscriptionPlanRepo.findOne({
      where: { id: planId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói tháng');
    return plan;
  }

  async fulfillSubscription(
    manager: EntityManager,
    order: ListingPaymentOrder,
  ) {
    const planId = Number(order.metadata.subscriptionPlanId);
    const plan = await manager.findOne(SellerSubscriptionPlan, {
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói tháng');
    const latest = await manager.findOne(SellerSubscription, {
      where: { userId: order.userId, isActive: true },
      order: { expiresAt: 'DESC' },
      lock: { mode: 'pessimistic_write' },
    });
    const startsAt =
      latest?.expiresAt && latest.expiresAt > new Date()
        ? latest.expiresAt
        : new Date();
    const subscription = manager.create(SellerSubscription, {
      userId: order.userId,
      planId: plan.id,
      orderId: order.id,
      startsAt,
      expiresAt: new Date(startsAt.getTime() + plan.durationDays * 86400000),
      isActive: true,
    });
    await manager.save(subscription);
  }
}
