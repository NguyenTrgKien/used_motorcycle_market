import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          url: configService.get<string>('DIRECT_URL'),
          ssl: {
            rejectUnauthorized: false,
          },
          autoLoadEntities: true,
          synchronize: false,
          logging: true,
        };
      },
    }),
  ],
  exports: [],
})
export class DatabaseModule {}
