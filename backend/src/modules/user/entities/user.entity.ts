import { UserGender, UserRole, UserStatus } from '@project/shared';
import { Conversation } from 'src/modules/conversation/entities/conversation.entity';
import { Message } from 'src/modules/message/entities/message.entity';
import { Notification } from 'src/modules/notification/entities/notification.entity';
import { Post } from 'src/modules/post/entities/post.entity';
import { Report } from 'src/modules/report/entities/report.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { SavedPost } from 'src/modules/saved_post/entities/saved_post.entity';
import { UserAddress } from 'src/modules/user_address/entities/user_address.entity';
import { UserIdentity } from 'src/modules/user_identity/entities/user_identity.entity';
import { UserVerification } from 'src/modules/user_verification/entities/user_verification.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index(['status', 'role'])
@Index(['status', 'isVerified'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Index()
  @Column({ type: 'varchar', length: 12, nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  publicId?: string;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender?: UserGender;

  @Index()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Index()
  @Column({
    default: false,
  })
  isVerified: boolean;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  facebookId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserAddress, (address) => address.user)
  addresses: UserAddress[];

  @OneToMany(() => UserVerification, (verifications) => verifications.user)
  verifications: UserVerification[];

  @OneToOne(() => UserIdentity, (identity) => identity.user)
  identity: UserIdentity;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Conversation, (conversation) => conversation.buyer)
  buyerConversation: Conversation[];

  @OneToMany(() => Conversation, (conversation) => conversation.seller)
  sellerConversation: Conversation[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => Review, (review) => review.reviewer)
  givenReviews: Review[];

  @OneToMany(() => Review, (review) => review.reviewee)
  receiveReviews: Review[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notification: Notification[];

  @OneToMany(() => SavedPost, (save_post) => save_post.user)
  save_posts: SavedPost[];

  @OneToMany(() => Report, (report) => report.reporter)
  givenReports: Report[];
}
