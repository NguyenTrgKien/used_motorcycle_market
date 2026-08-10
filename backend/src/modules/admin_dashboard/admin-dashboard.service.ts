import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostStatus, UserRole } from 'src/shared';
import { Repository } from 'typeorm';
import { ListingPaymentOrder } from '../listing_payment/entities/listing-payment-order.entity';
import { ListingPaymentStatus } from '../listing_payment/listing-payment.types';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ListingPaymentOrder)
    private readonly orderRepo: Repository<ListingPaymentOrder>,
  ) {}

  async getStats() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const [
      activePosts,
      users,
      pendingPosts,
      currentPosts,
      previousPosts,
      currentUsers,
      previousUsers,
      currentRevenue,
      previousRevenue,
    ] = await Promise.all([
      this.postRepo.count({ where: { status: PostStatus.ACTIVE } }),
      this.userRepo.count({ where: { role: UserRole.USER } }),
      this.postRepo.count({ where: { status: PostStatus.PENDING } }),
      this.countPostsCreatedBetween(currentMonthStart, nextMonthStart),
      this.countPostsCreatedBetween(previousMonthStart, currentMonthStart),
      this.countUsersCreatedBetween(currentMonthStart, nextMonthStart),
      this.countUsersCreatedBetween(previousMonthStart, currentMonthStart),
      this.sumRevenueBetween(currentMonthStart, nextMonthStart),
      this.sumRevenueBetween(previousMonthStart, currentMonthStart),
    ]);

    return {
      data: {
        activePosts: {
          value: activePosts,
          trendPercent: this.calculateTrend(currentPosts, previousPosts),
        },
        users: {
          value: users,
          trendPercent: this.calculateTrend(currentUsers, previousUsers),
        },
        pendingPosts: { value: pendingPosts },
        monthlyRevenue: {
          value: currentRevenue,
          trendPercent: this.calculateTrend(currentRevenue, previousRevenue),
        },
      },
    };
  }

  async getTrends(range = '30d') {
    if (!['7d', '30d'].includes(range)) {
      throw new BadRequestException('Khoảng thời gian chỉ hỗ trợ 7d hoặc 30d');
    }

    const days = range === '7d' ? 7 : 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentStart = this.addDays(today, -(days - 1));
    const currentEnd = this.addDays(today, 1);
    const previousStart = this.addDays(currentStart, -days);

    const [revenueRows, userRows, postRows] = await Promise.all([
      this.orderRepo
        .createQueryBuilder('payment')
        .select("TO_CHAR(payment.paidAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .where('payment.status = :status', {
          status: ListingPaymentStatus.PAID,
        })
        .andWhere('payment.paidAt >= :start', { start: previousStart })
        .andWhere('payment.paidAt < :end', { end: currentEnd })
        .groupBy("TO_CHAR(payment.paidAt, 'YYYY-MM-DD')")
        .getRawMany<{ date: string; value: string }>(),
      this.userRepo
        .createQueryBuilder('user')
        .select("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(user.id)', 'value')
        .where('user.role = :role', { role: UserRole.USER })
        .andWhere('user.createdAt >= :start', { start: previousStart })
        .andWhere('user.createdAt < :end', { end: currentEnd })
        .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM-DD')")
        .getRawMany<{ date: string; value: string }>(),
      this.postRepo
        .createQueryBuilder('post')
        .select("TO_CHAR(post.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(post.id)', 'value')
        .where('post.createdAt >= :start', { start: previousStart })
        .andWhere('post.createdAt < :end', { end: currentEnd })
        .groupBy("TO_CHAR(post.createdAt, 'YYYY-MM-DD')")
        .getRawMany<{ date: string; value: string }>(),
    ]);

    const revenue = this.toValueMap(revenueRows);
    const users = this.toValueMap(userRows);
    const posts = this.toValueMap(postRows);
    const currentDates = this.createDateRange(currentStart, days);
    const previousDates = this.createDateRange(previousStart, days);
    const series = currentDates.map((date) => ({
      date,
      revenue: revenue.get(date) || 0,
      newUsers: users.get(date) || 0,
      newPosts: posts.get(date) || 0,
    }));

    const currentSummary = {
      revenue: this.sumMapDates(revenue, currentDates),
      newUsers: this.sumMapDates(users, currentDates),
      newPosts: this.sumMapDates(posts, currentDates),
    };
    const previousSummary = {
      revenue: this.sumMapDates(revenue, previousDates),
      newUsers: this.sumMapDates(users, previousDates),
      newPosts: this.sumMapDates(posts, previousDates),
    };

    return {
      data: {
        range,
        summary: {
          revenue: {
            value: currentSummary.revenue,
            trendPercent: this.calculateTrend(
              currentSummary.revenue,
              previousSummary.revenue,
            ),
          },
          newUsers: {
            value: currentSummary.newUsers,
            trendPercent: this.calculateTrend(
              currentSummary.newUsers,
              previousSummary.newUsers,
            ),
          },
          newPosts: {
            value: currentSummary.newPosts,
            trendPercent: this.calculateTrend(
              currentSummary.newPosts,
              previousSummary.newPosts,
            ),
          },
        },
        series,
      },
    };
  }

  private countPostsCreatedBetween(start: Date, end: Date) {
    return this.postRepo
      .createQueryBuilder('post')
      .where('post.createdAt >= :start', { start })
      .andWhere('post.createdAt < :end', { end })
      .getCount();
  }

  private countUsersCreatedBetween(start: Date, end: Date) {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.USER })
      .andWhere('user.createdAt >= :start', { start })
      .andWhere('user.createdAt < :end', { end })
      .getCount();
  }

  private async sumRevenueBetween(start: Date, end: Date) {
    const result = await this.orderRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', {
        status: ListingPaymentStatus.PAID,
      })
      .andWhere('payment.paidAt >= :start', { start })
      .andWhere('payment.paidAt < :end', { end })
      .getRawOne<{ total: string | number }>();

    return Number(result?.total || 0);
  }

  private calculateTrend(current: number, previous: number) {
    if (previous === 0) return null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createDateRange(start: Date, days: number) {
    return Array.from({ length: days }, (_, index) =>
      this.formatDate(this.addDays(start, index)),
    );
  }

  private toValueMap(rows: { date: string; value: string }[]) {
    return new Map(rows.map((row) => [row.date, Number(row.value)]));
  }

  private sumMapDates(values: Map<string, number>, dates: string[]) {
    return dates.reduce((total, date) => total + (values.get(date) || 0), 0);
  }
}
