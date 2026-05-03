import { Injectable } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class AddressService {
  private readonly dataPath = path.join(
    process.cwd(),
    'src/data/addresses.json',
  );
  getAddresses() {
    const raw = fs.readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(raw);
  }
}
