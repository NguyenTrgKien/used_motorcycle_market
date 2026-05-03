import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AddressService } from './address.service';

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}
  @Public()
  @Get()
  getAddresses() {
    return this.addressService.getAddresses();
  }
}
