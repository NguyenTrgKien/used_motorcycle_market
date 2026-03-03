import { TypeOrmModule } from '@nestjs/typeorm';

export const typeOrmConfig = () => {
  return TypeOrmModule.forRoot({});
};
