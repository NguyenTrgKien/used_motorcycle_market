import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Conversation } from './entities/conversation.entity';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: number;
  };
}

interface MessagePayload {
  id: number;
  senderId: number;
  conversationId: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
export class ConversationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = this.getAccessToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        sessionId?: number;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const userId = Number(payload.sub);
      const isBlacklisted = await this.authService.isBlacklisted(token);

      if (isBlacklisted) {
        client.disconnect();
        return;
      }

      if (payload.sessionId) {
        const isSessionActive = await this.authService.isSessionActive(
          payload.sessionId,
          userId,
        );

        if (!isSessionActive) {
          client.disconnect();
          return;
        }

        await this.authService.touchSession(payload.sessionId);
      }

      client.data.userId = userId;
      await client.join(this.getUserRoom(userId));
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation.join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: number },
  ) {
    const conversationId = Number(body?.conversationId);

    if (!client.data.userId || !conversationId) return;

    const hasAccess = await this.conversationRepo.exists({
      where: [
        { id: conversationId, buyerId: client.data.userId },
        { id: conversationId, sellerId: client.data.userId },
      ],
    });

    if (!hasAccess) return;

    await client.join(this.getConversationRoom(conversationId));
  }

  @SubscribeMessage('conversation.leave')
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: number },
  ) {
    const conversationId = Number(body?.conversationId);

    if (!conversationId) return;

    await client.leave(this.getConversationRoom(conversationId));
  }

  emitMessageCreated(message: MessagePayload) {
    this.server
      .to(this.getConversationRoom(message.conversationId))
      .emit('message.created', message);
  }

  emitConversationUpdated(conversation: Conversation, message: MessagePayload) {
    const payload = {
      conversationId: conversation.id,
      senderId: message.senderId,
      lastMessage: message.content,
      lastMessageAt: message.createdAt,
      updatedAt: message.createdAt,
    };

    this.server
      .to(this.getUserRoom(conversation.buyerId))
      .to(this.getUserRoom(conversation.sellerId))
      .emit('conversation.updated', payload);
  }

  private getAccessToken(client: Socket) {
    const cookie = client.handshake.headers.cookie || '';
    const tokenCookie = cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('access_token='));

    return tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;
  }

  private getConversationRoom(conversationId: number) {
    return `conversation:${conversationId}`;
  }

  private getUserRoom(userId: number) {
    return `user:${userId}`;
  }
}
