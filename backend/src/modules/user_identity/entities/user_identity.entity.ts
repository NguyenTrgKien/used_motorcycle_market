import { IdentityStatus, IdType, UserGender } from 'src/shared';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Unique(['userId'])
@Unique(['idNumber', 'idType'])
@Entity('user_identities')
export class UserIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  idNumber: string;

  @Column({ type: 'enum', enum: IdType })
  idType: IdType;

  @Column()
  fullName: string;

  @Column()
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: UserGender })
  gender: UserGender;

  @Column()
  issueDate: Date;

  @Column()
  issuePlace: string;

  @Column()
  address: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  idFrontUrl?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  idBackUrl?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  selfieUrl?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  idFrontPublicId?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  idBackPublicId?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  selfiePublicId?: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: IdentityStatus,
    default: IdentityStatus.PENDING,
  })
  status: IdentityStatus;

  @Column({ type: 'float', default: 0 })
  confidenceScore: number;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'user_id' })
  userId: number;

  @Index()
  @OneToOne(() => User, (user) => user.identity)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
