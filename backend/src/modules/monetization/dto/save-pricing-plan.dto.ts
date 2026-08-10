import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ListingPricingGroup, MonetizationProductType, SellerAudience } from '../../listing_payment/listing-payment.types';

export class SavePricingPlanDto {
  @IsString()
  name: string;

  @IsEnum(MonetizationProductType)
  productType: MonetizationProductType;

  @IsOptional()
  @IsEnum(ListingPricingGroup)
  pricingGroup?: ListingPricingGroup;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsEnum(SellerAudience)
  sellerAudience: SellerAudience;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  boostCredits?: number;

  @IsOptional()
  @IsBoolean()
  recommended?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
