import { ProfessionalSellerStatus } from 'src/shared';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('professional_seller_profiles')
@Index(['status', 'createdAt'])
export class ProfessionalSellerProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @Column({ type: 'varchar', length: 150 })
  storeName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  taxCode: string;

  @Column({ type: 'varchar', length: 255 })
  businessLicenseUrl: string;

  @Column({ type: 'varchar', length: 255 })
  businessLicensePublicId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoPublicId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverPublicId?: string;

  @Column({ type: 'varchar', length: 100 })
  province: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward?: string;

  @Column({ type: 'varchar', length: 255 })
  addressDetail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({
    type: 'enum',
    enum: ProfessionalSellerStatus,
    default: ProfessionalSellerStatus.PENDING,
  })
  status: ProfessionalSellerStatus;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  verifiedBy?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectedReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.professionalSellerProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
