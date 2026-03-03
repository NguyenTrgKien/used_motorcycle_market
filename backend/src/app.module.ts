import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envConfig } from './configs/envConfig';
import { MailModule } from './modules/mail/mail.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { MotorcycleModule } from './modules/motorcycle/motorcycle.module';
import { PostModule } from './modules/post/post.module';
import { PostImageModule } from './modules/post_image/post_image.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { MessageModule } from './modules/message/message.module';
import { ReviewModule } from './modules/review/review.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SavedPostModule } from './modules/saved_post/saved_post.module';
import { ReportModule } from './modules/report/report.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    envConfig(),
    DatabaseModule,
    MailModule,
    UserModule,
    CategoryModule,
    MotorcycleModule,
    PostModule,
    PostImageModule,
    ConversationModule,
    MessageModule,
    ReviewModule,
    NotificationModule,
    SavedPostModule,
    ReportModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
