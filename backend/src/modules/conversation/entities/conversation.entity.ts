import { Message } from 'src/modules/message/entities/message.entity';
import { Post } from 'src/modules/post/entities/post.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index('IDX_conversations_buyer_updated', ['buyerId', 'updatedAt'])
@Index('IDX_conversations_seller_updated', ['sellerId', 'updatedAt'])
@Index('IDX_conversations_pair_post', ['buyerId', 'sellerId', 'postId'], {
  unique: true,
})
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  buyerId: number;

  @Column()
  sellerId: number;

  @Column()
  postId: number;

  @Column({ type: 'text', nullable: true })
  lastMessage: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  lastSenderId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @ManyToOne(() => User, (user) => user.buyerConversation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @ManyToOne(() => User, (user) => user.sellerConversation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @ManyToOne(() => Post, (post) => post.conversations)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
