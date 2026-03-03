import {
  MotorCondition,
  MotorFuelType,
  MotorTransmission,
} from '@project/shared';
import { Post } from 'src/modules/post/entities/post.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('motorcycles')
export class Motorcycle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  mileage: number;

  @Column()
  color: string;

  @Column({ type: 'enum', enum: MotorCondition, default: MotorCondition.USED })
  condition: MotorCondition;

  @Column()
  engineCapacity: string;

  @Column({ nullable: true })
  licensePlate?: string;

  @Column({
    type: 'enum',
    enum: MotorFuelType,
  })
  fuelType: MotorFuelType;

  @Column({
    type: 'enum',
    enum: MotorTransmission,
  })
  transmission: MotorTransmission;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Post, (post) => post, { onDelete: 'CASCADE' })
  post: Post;
}
