import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ConversationGateway } from './conversation.gateway';
import Redis from 'ioredis';
import { CONVERSATION_REDIS } from './conversation.constants';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Post, User]),
    AuthModule,
    CloudinaryModule,
    NotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationGateway,
    {
      provide: CONVERSATION_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis(
          config.get<string>('REDIS_URL') || 'redis://localhost:6379',
          {
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 500,
          },
        );

        redis.on('error', () => undefined);
        redis.connect().catch(() => undefined);

        return redis;
      },
    },
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
