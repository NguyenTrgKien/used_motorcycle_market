import { Module } from '@nestjs/common';
import { SavedPostService } from './saved_post.service';
import { SavedPostController } from './saved_post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPost } from './entities/saved_post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPost])],
  controllers: [SavedPostController],
  providers: [SavedPostService],
  exports: [SavedPostService],
})
export class SavedPostModule {}
