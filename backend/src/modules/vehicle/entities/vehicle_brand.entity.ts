import { Category } from 'src/modules/category/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleModel } from './vehicle_model.entity';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_brands')
@Index('IDX_vehicle_brands_slug', ['slug'], { unique: true })
export class VehicleBrand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VehicleModel, (model) => model.brand)
  models: VehicleModel[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.brand)
  vehicles: Vehicle[];

  @ManyToMany(() => Category, (category) => category.vehicleBrands)
  categories: Category[];
}
