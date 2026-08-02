import { IsEnum, IsInt, Min } from 'class-validator';
import { ListingPaymentMethod } from '../listing-payment.types';

export class CreateListingPaymentOrderDto {
  @IsInt()
  @Min(1)
  postId: number;

  @IsEnum(ListingPaymentMethod)
  method: ListingPaymentMethod;
}
