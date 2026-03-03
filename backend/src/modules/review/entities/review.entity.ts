import { Post } from 'src/modules/post/entities/post.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reviewerId: number;

  @Column()
  revieweeId: number;

  @Column()
  postId: number;

  @Column({ type: 'int' })
  @Check('rating >= 1 AND rating <= 5')
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.givenReviews)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @ManyToOne(() => User, (user) => user.receiveReviews)
  @JoinColumn({ name: 'revieweeId' })
  reviewee: User;

  @ManyToOne(() => Post, (post) => post.reviews)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
