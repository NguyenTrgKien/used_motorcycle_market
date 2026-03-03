import { ReasonType, ReportStatus, TargetType } from '@project/shared';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reports')
@Index(['status'])
@Index(['reporterId'])
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reporterId: number;

  @Column()
  targetId: number;

  @Column({ type: 'enum', enum: TargetType })
  targetType: TargetType;

  @Column({ type: 'enum', enum: ReasonType })
  reasonType: ReasonType;

  @Column()
  reasonDetail: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.givenReports)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;
}
