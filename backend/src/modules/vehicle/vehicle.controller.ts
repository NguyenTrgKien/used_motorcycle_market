import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleService } from './vehicle.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/shared';
import { CreateVehicleBrandDto } from './dto/create-vehicle-brand.dto';
import { UpdateVehicleBrandDto } from './dto/update-vehicle-brand.dto';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Public()
  @Get('brands')
  findAllBrands() {
    return this.vehicleService.findAllBrands();
  }

  @Roles(UserRole.ADMIN)
  @Post('brands')
  @UseInterceptors(FileInterceptor('logo'))
  createBrand(
    @Body() createVehicleBrandDto: CreateVehicleBrandDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.vehicleService.createBrand(createVehicleBrandDto, logo);
  }

  @Roles(UserRole.ADMIN)
  @Patch('brands/:id')
  @UseInterceptors(FileInterceptor('logo'))
  updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleBrandDto: UpdateVehicleBrandDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.vehicleService.updateBrand(id, updateVehicleBrandDto, logo);
  }

  @Roles(UserRole.ADMIN)
  @Patch('brands/:id/toggle-active')
  toggleBrandActive(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.toggleBrandActive(id);
  }

  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehicleService.update(+id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(+id);
  }
}
