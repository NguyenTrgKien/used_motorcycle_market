import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingPricingGroup } from '../listing-payment.types';

@Entity('listing_free_quotas')
@Index(['userId', 'pricingGroup'], { unique: true })
export class ListingFreeQuota {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 30 })
  pricingGroup: ListingPricingGroup;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
