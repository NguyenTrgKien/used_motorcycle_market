import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('seller_subscriptions')
@Index(['userId', 'expiresAt'])
export class SellerSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  planId: number;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  listingsUsed: number;

  @Column({ type: 'int', default: 0 })
  boostsUsed: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
