import { Category } from 'src/modules/category/entities/category.entity';
import { Post } from 'src/modules/post/entities/post.entity';
import {
  VehicleBodyType,
  VehicleCondition,
  VehicleFuelType,
  VehicleTransmission,
} from 'src/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleBrand } from './vehicle_brand.entity';
import { VehicleModel } from './vehicle_model.entity';

@Entity('vehicles')
@Index('IDX_vehicles_brand_model', ['brandId', 'modelId'])
@Index('IDX_vehicles_body_fuel', ['bodyType', 'fuelType'])
@Index('IDX_vehicles_manufacture_year', ['manufactureYear'])
@Index('IDX_vehicles_mileage', ['mileage'])
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  postId: number;

  @Column({ nullable: true })
  categoryId?: number;

  @Column({ nullable: true })
  brandId?: number;

  @Column({ nullable: true })
  modelId?: number;

  @Column()
  brandName: string;

  @Column()
  modelName: string;

  @Column({
    type: 'enum',
    enum: VehicleBodyType,
    default: VehicleBodyType.OTHER,
  })
  bodyType: VehicleBodyType;

  @Column({ type: 'int', nullable: true })
  manufactureYear?: number;

  @Column({ type: 'int', nullable: true })
  registrationYear?: number;

  @Column({ type: 'int', nullable: true })
  mileage?: number;

  @Column({ nullable: true })
  color?: string;

  @Column({
    type: 'enum',
    enum: VehicleCondition,
    default: VehicleCondition.USED,
  })
  condition: VehicleCondition;

  @Column({ nullable: true })
  engineCapacity?: string;

  @Column({ nullable: true })
  enginePower?: string;

  @Column({ nullable: true })
  batteryCapacity?: string;

  @Column({ nullable: true })
  rangePerCharge?: string;

  @Column({ nullable: true })
  licensePlate?: string;

  @Column({
    type: 'enum',
    enum: VehicleFuelType,
    default: VehicleFuelType.OTHER,
  })
  fuelType: VehicleFuelType;

  @Column({
    type: 'enum',
    enum: VehicleTransmission,
    default: VehicleTransmission.OTHER,
  })
  transmission: VehicleTransmission;

  @Column({ nullable: true })
  origin?: string;

  @Column({ nullable: true })
  documentsStatus?: string;

  @Column({ type: 'jsonb', nullable: true })
  documentImages?: Array<{ url: string; publicId: string }>;

  @Column({ type: 'int', nullable: true })
  seatCount?: number;

  @Column({ type: 'int', nullable: true })
  doorCount?: number;

  @Column({ type: 'int', nullable: true })
  payloadKg?: number;

  @Column({ type: 'int', nullable: true })
  grossWeightKg?: number;

  @Column({ type: 'int', nullable: true })
  wheelCount?: number;

  @Column({ type: 'jsonb', nullable: true })
  extraSpecs?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Post, (post) => post.vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => Category, (category) => category.vehicles, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @ManyToOne(() => VehicleBrand, (brand) => brand.vehicles, {
    nullable: true,
  })
  @JoinColumn({ name: 'brandId' })
  brand?: VehicleBrand;

  @ManyToOne(() => VehicleModel, (model) => model.vehicles, {
    nullable: true,
  })
  @JoinColumn({ name: 'modelId' })
  model?: VehicleModel;
}
