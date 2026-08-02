import { Injectable } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';

export interface AddressWard {
  name: string;
}

export interface AddressDistrict {
  name: string;
  wards: AddressWard[];
}

export interface AddressProvince {
  name: string;
  districts: AddressDistrict[];
}

@Injectable()
export class AddressService {
  private readonly dataPath = path.join(
    process.cwd(),
    'src/data/addresses.json',
  );
  getAddresses(): AddressProvince[] {
    const raw = fs.readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(raw) as AddressProvince[];
  }

  isValidAddress(province: string, district: string, ward?: string) {
    const selectedProvince = this.getAddresses().find(
      (item) => item.name === province,
    );
    const selectedDistrict = selectedProvince?.districts.find(
      (item) => item.name === district,
    );
    if (!selectedProvince || !selectedDistrict) return false;
    if (!ward) return true;
    return selectedDistrict.wards.some((item) => item.name === ward);
  }
}
