import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, LessThan, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Message } from '../message/entities/message.entity';
import { Post } from '../post/entities/post.entity';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { MessageType } from 'src/shared';
import { ConversationGateway } from './conversation.gateway';
import Redis from 'ioredis';
import { CONVERSATION_REDIS } from './conversation.constants';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/shared';

@Injectable()
export class ConversationService implements OnModuleDestroy {
  private readonly conversationListCacheTtl = 30;

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly conversationGateway: ConversationGateway,
    @Inject(CONVERSATION_REDIS)
    private readonly redis: Redis,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private async findConversationForUser(
    userId: number,
    conversationId: number,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: {
        buyer: true,
        seller: true,
        post: { post_images: true },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập hội thoại này');
    }

    return conversation;
  }

  private formatPost(post?: Post) {
    if (!post) return undefined;

    const image = [...(post.post_images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )[0];

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      price: Number(post.price),
      imageUrl: image?.imageUrl,
    };
  }

  private formatParticipant(conversation: Conversation, userId: number) {
    const participant =
      conversation.buyerId === userId
        ? conversation.seller
        : conversation.buyer;

    return {
      id: participant?.id,
      fullName: participant?.fullName,
      avatar: participant?.avatar,
      phone: participant?.showPhone ? participant?.phone : undefined,
      isVerified: participant?.isVerified,
    };
  }

  private formatConversation(
    conversation: Conversation,
    userId: number,
    unreadCount = 0,
    totalUnreadCount = 0,
  ) {
    return {
      id: conversation.id,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      postId: conversation.postId,
      participant: this.formatParticipant(conversation, userId),
      post: this.formatPost(conversation.post),
      lastMessage: conversation.lastMessage || '',
      lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
      unreadCount,
      totalUnreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private getConversationListCacheKey(userId: number) {
    return `conversation:list:user:${userId}`;
  }

  private async getCachedConversationList(userId: number) {
    try {
      const cached = await this.redis.get(
        this.getConversationListCacheKey(userId),
      );

      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCachedConversationList(userId: number, value: unknown) {
    try {
      await this.redis.set(
        this.getConversationListCacheKey(userId),
        JSON.stringify(value),
        'EX',
        this.conversationListCacheTtl,
      );
    } catch (error) {
      console.log(error);
    }
  }

  private async invalidateConversationListCache(...userIds: number[]) {
    const keys = [...new Set(userIds)].map((userId) =>
      this.getConversationListCacheKey(userId),
    );

    if (!keys.length) return;

    try {
      await this.redis.del(...keys);
    } catch (error) {
      console.log(error);
    }
  }

  private async getUnreadCounts(conversationIds: number[], userId: number) {
    if (!conversationIds.length)
      return new Map<number, Record<string, number>>();

    const rows = await this.messageRepo
      .createQueryBuilder('message')
      .select('message.conversationId', 'conversationId')
      .addSelect(
        'COUNT(*) FILTER (WHERE message.senderId != :userId AND message.isRead = false)',
        'unreadCount',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE message.isRead = false)',
        'totalUnreadCount',
      )
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .groupBy('message.conversationId')
      .setParameter('userId', userId)
      .getRawMany<{
        conversationId: string;
        unreadCount: string;
        totalUnreadCount: string;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.conversationId),
        {
          unreadCount: Number(row.unreadCount),
          totalUnreadCount: Number(row.totalUnreadCount),
        },
      ]),
    );
  }

  private getLastMessageText(messageType: MessageType, content: string) {
    if (messageType === MessageType.IMAGE) return '[Hình ảnh]';
    if (messageType === MessageType.FILE) return '[Tệp đính kèm]';

    return content;
  }

  async start(userId: number, createConversationDto: CreateConversationDto) {
    const post = await this.postRepo.findOne({
      where: { id: createConversationDto.postId },
      relations: { post_images: true, user: true },
    });

    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');
    if (post.userId === userId) {
      throw new BadRequestException('Bạn không thể tự chat với tin của mình');
    }

    let conversation = await this.conversationRepo.findOne({
      where: {
        buyerId: userId,
        sellerId: post.userId,
        postId: post.id,
      },
      relations: {
        buyer: true,
        seller: true,
        post: { post_images: true },
      },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.save(
        this.conversationRepo.create({
          buyerId: userId,
          sellerId: post.userId,
          postId: post.id,
        }),
      );
      conversation = await this.findConversationForUser(
        userId,
        conversation.id,
      );
    }

    const unreadCounts = await this.getUnreadCounts([conversation.id], userId);
    const counts = unreadCounts.get(conversation.id);

    return {
      message: 'Mở hội thoại thành công',
      data: this.formatConversation(
        conversation,
        userId,
        counts?.unreadCount || 0,
        counts?.totalUnreadCount || 0,
      ),
    };
  }

  async findAll(userId: number) {
    const cached = await this.getCachedConversationList(userId);

    if (cached) return cached;

    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.buyer', 'buyer')
      .leftJoinAndSelect('conversation.seller', 'seller')
      .leftJoinAndSelect('conversation.post', 'post')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .where(
        new Brackets((qb) => {
          qb.where('conversation.buyerId = :userId', { userId }).orWhere(
            'conversation.sellerId = :userId',
            { userId },
          );
        }),
      )
      .andWhere('conversation.lastMessage IS NOT NULL')
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    const unreadCounts = await this.getUnreadCounts(
      conversations.map((conversation) => conversation.id),
      userId,
    );
    const response = {
      message: 'Lấy danh sách hội thoại thành công',
      data: conversations.map((conversation) => {
        const counts = unreadCounts.get(conversation.id);

        return this.formatConversation(
          conversation,
          userId,
          counts?.unreadCount || 0,
          counts?.totalUnreadCount || 0,
        );
      }),
    };

    await this.setCachedConversationList(userId, response);

    return response;
  }

  async findMessages(
    userId: number,
    conversationId: number,
    limit = 50,
    beforeId?: number,
  ) {
    await this.findConversationForUser(userId, conversationId);
    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const messages = await this.messageRepo.find({
      where: {
        conversationId,
        ...(beforeId ? { id: LessThan(beforeId) } : {}),
      },
      relations: { user: true },
      order: { id: 'DESC' },
      take,
    });
    const orderedMessages = messages.reverse();

    return {
      message: 'Lấy tin nhắn thành công',
      data: orderedMessages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        publicId: message.publicId,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: message.user?.id,
          fullName: message.user?.fullName,
          avatar: message.user?.avatar,
        },
      })),
    };
  }

  async createMessage(
    userId: number,
    conversationId: number,
    createMessageDto: CreateMessageDto,
    file?: Express.Multer.File,
  ) {
    const conversation = await this.findConversationForUser(
      userId,
      conversationId,
    );
    const rawContent = createMessageDto.content?.trim() || '';
    let content = rawContent;
    let messageType = createMessageDto.messageType || MessageType.TEXT;
    let publicId: string | undefined;

    if (file) {
      const uploadedFile = await this.cloudinaryService.uploadSingleFile(file);
      publicId = uploadedFile.publicId;
      messageType = file.mimetype.startsWith('image/')
        ? MessageType.IMAGE
        : MessageType.FILE;
      content =
        messageType === MessageType.IMAGE
          ? uploadedFile.url
          : JSON.stringify({
              url: uploadedFile.url,
              name: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
            });
    } else if (
      messageType === MessageType.IMAGE ||
      messageType === MessageType.FILE
    ) {
      throw new BadRequestException('Vui lòng chọn tệp cần gửi');
    } else if (!content) {
      throw new BadRequestException('Vui lòng nhập nội dung tin nhắn');
    }

    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        senderId: userId,
        content,
        messageType,
        publicId,
      }),
    );

    conversation.lastMessage = this.getLastMessageText(
      message.messageType,
      message.content,
    );
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = message.senderId;
    conversation.updatedAt = message.createdAt;
    await this.conversationRepo.save(conversation);
    await this.invalidateConversationListCache(
      conversation.buyerId,
      conversation.sellerId,
    );
    const receiverId =
      conversation.buyerId === userId
        ? conversation.sellerId
        : conversation.buyerId;
    await this.notificationService.createNotification({
      userId: receiverId,
      title: 'Bạn có tin nhắn mới',
      content: this.getLastMessageText(message.messageType, message.content),
      type: NotificationType.NEW_MESSAGE,
      referenceId: conversation.id,
    });

    const messagePayload = {
      id: message.id,
      senderId: message.senderId,
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType,
      publicId: message.publicId,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    this.conversationGateway.emitMessageCreated(messagePayload);
    this.conversationGateway.emitConversationUpdated(
      conversation,
      messagePayload,
    );

    return {
      message: 'Gửi tin nhắn thành công',
      data: messagePayload,
    };
  }

  async markRead(userId: number, conversationId: number) {
    await this.findConversationForUser(userId, conversationId);
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .execute();
    await this.invalidateConversationListCache(userId);

    return {
      message: 'Đã đánh dấu hội thoại là đã đọc',
    };
  }
}
