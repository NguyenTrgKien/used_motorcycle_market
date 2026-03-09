import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ConfigService, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
