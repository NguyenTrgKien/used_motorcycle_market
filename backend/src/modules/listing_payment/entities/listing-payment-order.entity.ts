import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ListingPaymentMethod,
  ListingPaymentStatus,
} from '../listing-payment.types';

@Entity('listing_payment_orders')
@Index(['userId', 'createdAt'])
export class ListingPaymentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  code: string;

  @Column()
  userId: number;

  @Column({ unique: true })
  postId: number;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 30 })
  method: ListingPaymentMethod;

  @Column({
    type: 'varchar',
    length: 20,
    default: ListingPaymentStatus.PENDING,
  })
  status: ListingPaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse?: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  receiptPublicId?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  transferSubmittedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectedReason?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date | null;

  @Column({ type: 'int', nullable: true })
  rejectedBy?: number | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  rejectionHistory: Array<{
    reason: string;
    rejectedAt: string;
    rejectedBy: number;
    receiptUrl?: string;
  }>;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
