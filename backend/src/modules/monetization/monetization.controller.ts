import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import type { RequestWithUser } from '../auth/auth.controller';
import { SavePricingPlanDto } from './dto/save-pricing-plan.dto';
import { SaveSubscriptionPlanDto } from './dto/save-subscription-plan.dto';
import { MonetizationService } from './monetization.service';

@Controller('monetization')
export class MonetizationController {
  constructor(private readonly service: MonetizationService) {}

  @Roles(UserRole.USER)
  @Get('plans')
  getPlans(@Req() req: RequestWithUser, @Query('postId') postId?: string) {
    return this.service.getPlans(
      req.user.id,
      postId ? Number(postId) : undefined,
    );
  }

  @Roles(UserRole.USER)
  @Get('subscriptions/plans')
  getSubscriptionPlans() {
    return this.service.getSubscriptionPlans();
  }

  @Roles(UserRole.USER)
  @Get('subscriptions/mine')
  getMine(@Req() req: RequestWithUser) {
    return this.service.getMySubscription(req.user.id);
  }

  @Roles(UserRole.USER)
  @Get('boost-campaigns/mine')
  getMyBoostCampaigns(
    @Req() req: RequestWithUser,
    @Query('postId') postId?: string,
  ) {
    return this.service.getMyBoostCampaigns(
      req.user.id,
      postId ? Number(postId) : undefined,
    );
  }

  @Roles(UserRole.USER)
  @Post('subscriptions/boost/:postId')
  boostWithSubscription(
    @Req() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.service.boostWithSubscription(req.user.id, postId);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/plans')
  getPlansAdmin() {
    return this.service.getPricingPlansAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/plans')
  createPlan(@Req() req: RequestWithUser, @Body() dto: SavePricingPlanDto) {
    return this.service.savePricingPlan(dto, undefined, req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/plans/:id')
  updatePlan(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SavePricingPlanDto,
  ) {
    return this.service.savePricingPlan(dto, id, req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/plans/:id')
  removePlan(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.removePricingPlan(id, req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/subscription-plans')
  getSubscriptionPlansAdmin() {
    return this.service.getSubscriptionPlansAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/subscription-plans')
  createSubscriptionPlan(@Body() dto: SaveSubscriptionPlanDto) {
    return this.service.saveSubscriptionPlan(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/subscription-plans/:id')
  updateSubscriptionPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveSubscriptionPlanDto,
  ) {
    return this.service.saveSubscriptionPlan(dto, id);
  }
}
