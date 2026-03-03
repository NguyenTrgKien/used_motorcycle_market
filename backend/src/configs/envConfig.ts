import { ConfigModule } from '@nestjs/config';

export const envConfig = () => {
  return ConfigModule.forRoot({
    isGlobal: true,
  });
};
