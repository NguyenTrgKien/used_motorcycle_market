import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ListingPricingGroup,
  MonetizationProductType,
  SellerAudience,
} from '../../listing_payment/listing-payment.types';

@Entity('listing_pricing_plans')
@Index(['productType', 'isActive'])
export class PricingPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  productType: MonetizationProductType;

  @Column({ type: 'varchar', length: 30, nullable: true })
  pricingGroup?: ListingPricingGroup | null;

  @Column({ type: 'int', nullable: true })
  categoryId?: number | null;

  @Column({ type: 'varchar', length: 30, default: SellerAudience.ALL })
  sellerAudience: SellerAudience;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', nullable: true })
  durationDays?: number | null;

  @Column({ type: 'int', default: 0 })
  boostCredits: number;

  @Column({ default: false })
  recommended: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
