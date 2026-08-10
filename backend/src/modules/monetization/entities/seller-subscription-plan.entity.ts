import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('seller_subscription_plans')
export class SellerSubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', default: 30 })
  durationDays: number;

  @Column({ type: 'int' })
  listingLimit: number;

  @Column({ type: 'int', default: 0 })
  boostCredits: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  recommended: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
