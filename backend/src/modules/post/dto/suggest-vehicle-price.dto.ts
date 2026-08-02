import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import {
  VehicleBodyType,
  VehicleCondition,
  VehicleFuelType,
  VehicleTransmission,
} from 'src/shared';

export class SuggestVehiclePriceDto {
  @IsNumberString()
  categoryId: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsEnum(VehicleBodyType)
  bodyType?: VehicleBodyType;

  @IsOptional()
  @IsNumberString()
  manufactureYear?: string;

  @IsOptional()
  @IsNumberString()
  registrationYear?: string;

  @IsOptional()
  @IsNumberString()
  mileage?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @IsOptional()
  @IsString()
  engineCapacity?: string;

  @IsOptional()
  @IsString()
  enginePower?: string;

  @IsOptional()
  @IsString()
  batteryCapacity?: string;

  @IsOptional()
  @IsString()
  rangePerCharge?: string;

  @IsOptional()
  @IsEnum(VehicleFuelType)
  fuelType?: VehicleFuelType;

  @IsOptional()
  @IsEnum(VehicleTransmission)
  transmission?: VehicleTransmission;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  documentsStatus?: string;

  @IsOptional()
  @IsNumberString()
  seatCount?: string;

  @IsOptional()
  @IsNumberString()
  doorCount?: string;

  @IsOptional()
  @IsNumberString()
  wheelCount?: string;

  @IsOptional()
  @IsNumberString()
  payloadKg?: string;

  @IsOptional()
  @IsNumberString()
  grossWeightKg?: string;

  @IsOptional()
  @IsString()
  province?: string;
}
