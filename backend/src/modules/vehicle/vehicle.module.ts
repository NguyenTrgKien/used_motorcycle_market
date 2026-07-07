import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleBrand } from './entities/vehicle_brand.entity';
import { VehicleModel } from './entities/vehicle_model.entity';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { GeminiRateLimiterModule } from '../gemini-rate-limiter/gemini-rate-limiter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleBrand, VehicleModel]),
    GeminiRateLimiterModule,
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
