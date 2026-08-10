import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('boost_campaigns')
@Index(['status', 'nextBoostAt'])
export class BoostCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  userId: number;

  @Column({ type: 'uuid', unique: true })
  orderId: string;

  @Column()
  pricingPlanId: number;

  @Column({ type: 'int' })
  totalBoosts: number;

  @Column({ type: 'int', default: 0 })
  boostsCompleted: number;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextBoostAt?: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
