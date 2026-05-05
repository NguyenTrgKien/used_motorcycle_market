import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền Tỉnh, Thành phố!' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền Quận, Huyện, Thị xã!' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng truyền Phường, Xã, Thị trấn!' })
  ward: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault: boolean;
}
