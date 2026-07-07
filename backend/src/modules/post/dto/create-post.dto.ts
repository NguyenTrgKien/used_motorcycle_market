import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  VehicleBodyType,
  VehicleCondition,
  VehicleFuelType,
  VehicleTransmission,
} from 'src/shared';

export class CreatePostDto {
  @IsNumberString()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  price: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  addressDetail?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsNumberString()
  brandId?: string;

  @IsOptional()
  @IsNumberString()
  modelId?: string;

  @IsEnum(VehicleBodyType)
  bodyType: VehicleBodyType;

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

  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

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
  @IsString()
  licensePlate?: string;

  @IsEnum(VehicleFuelType)
  fuelType: VehicleFuelType;

  @IsEnum(VehicleTransmission)
  transmission: VehicleTransmission;

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
  payloadKg?: string;

  @IsOptional()
  @IsNumberString()
  grossWeightKg?: string;

  @IsOptional()
  @IsNumberString()
  wheelCount?: string;

  @IsOptional()
  @IsString()
  extraSpecs?: string;
}
