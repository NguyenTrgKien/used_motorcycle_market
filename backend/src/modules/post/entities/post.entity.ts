import { PostStatus } from 'src/shared';
import { Category } from 'src/modules/category/entities/category.entity';
import { Conversation } from 'src/modules/conversation/entities/conversation.entity';
import { PostImage } from 'src/modules/post_image/entities/post_image.entity';
import { Report } from 'src/modules/report/entities/report.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { SavedPost } from 'src/modules/saved_post/entities/saved_post.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Vehicle } from 'src/modules/vehicle/entities/vehicle.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('posts')
@Index(['status', 'province'])
@Index(['userId', 'status'])
@Index(['categoryId', 'status'])
@Index('IDX_posts_status_price', ['status', 'price'])
@Index('IDX_posts_status_createdAt', ['status', 'createdAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  categoryId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value),
    },
  })
  price: number;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.PENDING })
  status: PostStatus;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'varchar', length: 100 })
  province: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  district?: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  ward?: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  addressDetail?: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  approvedBy?: number;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  rejectedReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  soldAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => PostImage, (post_image) => post_image.post)
  post_images: PostImage[];

  @OneToOne(() => Vehicle, (vehicle) => vehicle.post)
  vehicle: Vehicle;

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => SavedPost, (save_post) => save_post.post)
  save_posts: SavedPost[];

  @OneToMany(() => Review, (review) => review.post)
  reviews: Review[];

  @OneToMany(() => Conversation, (conversation) => conversation.post)
  conversations: Conversation[];
}
