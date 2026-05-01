import { VerificationType } from '@project/shared';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Xác thực người dùng
@Entity('user_verifications')
export class UserVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'enum', enum: VerificationType })
  type: VerificationType;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column()
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Index()
  @ManyToOne(() => User, (user) => user.verifications)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
