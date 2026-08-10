import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ListingPaymentMethod, MonetizationProductType } from '../listing-payment.types';

export class CreateListingPaymentOrderDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  postId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pricingPlanId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  subscriptionPlanId?: number;

  @IsOptional()
  @IsEnum(MonetizationProductType)
  orderType?: MonetizationProductType;

  @IsEnum(ListingPaymentMethod)
  method: ListingPaymentMethod;
}
