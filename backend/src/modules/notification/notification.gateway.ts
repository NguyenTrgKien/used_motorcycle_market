import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { Notification } from './entities/notification.entity';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: number;
  };
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
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

  emitNotificationCreated(notification: Notification) {
    this.server
      .to(this.getUserRoom(notification.userId))
      .emit('notification.created', notification);
  }

  private getAccessToken(client: Socket) {
    const cookie = client.handshake.headers.cookie || '';
    const tokenCookie = cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('access_token='));

    return tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;
  }

  private getUserRoom(userId: number) {
    return `user:${userId}`;
  }
}
