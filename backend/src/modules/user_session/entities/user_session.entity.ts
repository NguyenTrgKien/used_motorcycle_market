import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_session')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  refreshTokenHash: string;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ nullable: true }) // Tên trình duyệt
  browser: string;

  @Column({ nullable: true }) // Hệ điều hành
  os: string;

  @Column({ nullable: true }) // ip tại thời điểm đăng nhập
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' }) // Thời gian hết hạn
  expiredAt: Date;

  @Column({ nullable: true }) // Đã logout/thu hồi hay chưa
  revokedAt: Date;

  @Column({ nullable: true }) // Lần hoạt động cuối cùng
  lastActive: Date;

  @CreateDateColumn() // thời điểm session được tạo
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.user_session)
  user: User;
}
