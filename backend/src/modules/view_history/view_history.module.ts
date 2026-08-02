import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { ViewHistory } from './entities/view_history.entity';
import { ViewHistoryController } from './view_history.controller';
import { ViewHistoryService } from './view_history.service';

@Module({
  imports: [TypeOrmModule.forFeature([ViewHistory, Post])],
  controllers: [ViewHistoryController],
  providers: [ViewHistoryService],
})
export class ViewHistoryModule {}
