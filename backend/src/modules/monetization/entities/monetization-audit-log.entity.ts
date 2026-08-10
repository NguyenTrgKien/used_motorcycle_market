import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('monetization_audit_logs')
export class MonetizationAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adminId: number;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 50 })
  entityType: string;

  @Column({ nullable: true })
  entityId?: number;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
