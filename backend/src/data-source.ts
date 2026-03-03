import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { register } from 'tsconfig-paths';
import { resolve } from 'path';
dotenv.config();

register({
  baseUrl: resolve(__dirname, '..'),
  paths: {
    'src/*': ['src/*'],
  },
});

export default new DataSource({
  type: 'postgres',
  url: process.env.DIRECT_URL,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});
