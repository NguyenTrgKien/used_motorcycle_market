import { Category } from 'src/modules/category/entities/category.entity';
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
import { VehicleBrand } from './vehicle_brand.entity';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_models')
@Index('IDX_vehicle_models_brand_slug', ['brandId', 'slug'], { unique: true })
@Index('IDX_vehicle_models_category', ['categoryId'])
export class VehicleModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brandId: number;

  @Column({ nullable: true })
  categoryId?: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => VehicleBrand, (brand) => brand.models, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brandId' })
  brand: VehicleBrand;

  @ManyToOne(() => Category, (category) => category.vehicleModels, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles: Vehicle[];
}
