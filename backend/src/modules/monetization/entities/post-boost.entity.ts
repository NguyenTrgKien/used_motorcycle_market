import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('post_boosts')
@Index(['postId', 'boostedAt'])
export class PostBoost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ type: 'int', nullable: true })
  campaignId?: number;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  boostedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
