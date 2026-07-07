import { CategoryStatus } from 'src/shared';
import { Post } from 'src/modules/post/entities/post.entity';
import { Vehicle } from 'src/modules/vehicle/entities/vehicle.entity';
import { VehicleBrand } from 'src/modules/vehicle/entities/vehicle_brand.entity';
import { VehicleModel } from 'src/modules/vehicle/entities/vehicle_model.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  status: CategoryStatus;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.category)
  vehicles: Vehicle[];

  @OneToMany(() => VehicleModel, (model) => model.category)
  vehicleModels: VehicleModel[];

  @ManyToMany(() => VehicleBrand, (brand) => brand.categories)
  @JoinTable({
    name: 'vehicle_brand_categories',
    joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'brandId', referencedColumnName: 'id' },
  })
  vehicleBrands: VehicleBrand[];
}
