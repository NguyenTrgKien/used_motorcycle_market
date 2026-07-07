import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Message } from '../message/entities/message.entity';
import { Post } from '../post/entities/post.entity';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { MessageType } from 'src/shared';
import { ConversationGateway } from './conversation.gateway';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly conversationGateway: ConversationGateway,
  ) {}

  private async findConversationForUser(userId: number, conversationId: number) {
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
      conversation.buyerId === userId ? conversation.seller : conversation.buyer;

    return {
      id: participant?.id,
      fullName: participant?.fullName,
      avatar: participant?.avatar,
      phone: participant?.showPhone ? participant?.phone : undefined,
      isVerified: participant?.isVerified,
    };
  }

  private async formatConversation(conversation: Conversation, userId: number) {
    const lastMessage = await this.messageRepo.findOne({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
    });

    const unreadCount = await this.messageRepo.count({
      where: {
        conversationId: conversation.id,
        isRead: false,
      },
    });

    const unreadForUser = lastMessage
      ? await this.messageRepo
          .createQueryBuilder('message')
          .where('message.conversationId = :conversationId', {
            conversationId: conversation.id,
          })
          .andWhere('message.senderId != :userId', { userId })
          .andWhere('message.isRead = false')
          .getCount()
      : 0;

    return {
      id: conversation.id,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      postId: conversation.postId,
      participant: this.formatParticipant(conversation, userId),
      post: this.formatPost(conversation.post),
      lastMessage: lastMessage?.content || '',
      lastMessageAt: lastMessage?.createdAt || conversation.updatedAt,
      unreadCount: unreadForUser,
      totalUnreadCount: unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
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
      conversation = await this.findConversationForUser(userId, conversation.id);
    }

    return {
      message: 'Mở hội thoại thành công',
      data: await this.formatConversation(conversation, userId),
    };
  }

  async findAll(userId: number) {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.buyer', 'buyer')
      .leftJoinAndSelect('conversation.seller', 'seller')
      .leftJoinAndSelect('conversation.post', 'post')
      .leftJoinAndSelect('post.post_images', 'post_images')
      .innerJoin('conversation.messages', 'message')
      .where(
        new Brackets((qb) => {
          qb.where('conversation.buyerId = :userId', { userId }).orWhere(
            'conversation.sellerId = :userId',
            { userId },
          );
        }),
      )
      .distinct(true)
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    return {
      message: 'Lấy danh sách hội thoại thành công',
      data: await Promise.all(
        conversations.map((conversation) =>
          this.formatConversation(conversation, userId),
        ),
      ),
    };
  }

  async findMessages(userId: number, conversationId: number) {
    await this.findConversationForUser(userId, conversationId);

    const messages = await this.messageRepo.find({
      where: { conversationId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return {
      message: 'Lấy tin nhắn thành công',
      data: messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
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
  ) {
    const conversation = await this.findConversationForUser(
      userId,
      conversationId,
    );
    const content = createMessageDto.content.trim();

    if (!content) {
      throw new BadRequestException('Vui lòng nhập nội dung tin nhắn');
    }

    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        senderId: userId,
        content,
        messageType: MessageType.TEXT,
      }),
    );

    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    const messagePayload = {
      id: message.id,
      senderId: message.senderId,
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    this.conversationGateway.emitMessageCreated(messagePayload);
    this.conversationGateway.emitConversationUpdated(conversation, messagePayload);

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

    return {
      message: 'Đã đánh dấu hội thoại là đã đọc',
    };
  }
}
