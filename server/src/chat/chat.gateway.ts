import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';

interface SendMessagePayload {
  projectId?: string;
  content: string;
}

interface JoinRoomPayload {
  projectId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.setBroadcaster((userId: string, notification: any) => {
      this.server?.to(`user:${userId}`).emit('notification', notification);
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake?.auth?.token ||
        (typeof client.handshake?.headers?.authorization === 'string'
          ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined) ||
        (typeof client.handshake?.query?.token === 'string'
          ? client.handshake.query.token
          : undefined);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const secret =
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_SECRET ||
        'test-access-secret';

      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(token, { secret });
      } catch {
        client.disconnect(true);
        return;
      }

      const userId = payload.sub || payload.userId;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.data.user = { userId, ...payload };
      await client.join(`user:${userId}`);

      const projectId = client.handshake?.query?.projectId as string;
      if (projectId) {
        client.data.projectId = projectId;
        try {
          await this.chatService.verifyProjectMembership(projectId, userId);
        } catch {
          client.disconnect(true);
          return;
        }

        const roomName = `project:${projectId}`;
        await client.join(roomName);

        const messages = await this.chatService.getRecentMessages(
          projectId,
          50,
        );
        client.emit('history', messages);
        client.emit('messageHistory', { messages });
      }
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    // Socket cleanup handled automatically by Socket.IO
  }

  /**
   * Join a project chat room
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    if (!payload || !payload.projectId) {
      return { success: false, error: 'projectId is required' };
    }

    const { projectId } = payload;
    const user = client.data.user;
    if (!user || !user.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      await this.chatService.verifyProjectMembership(projectId, user.userId);
      const roomName = `project:${projectId}`;
      await client.join(roomName);
      client.data.projectId = projectId;

      const messages = await this.chatService.getRecentMessages(projectId, 50);
      client.emit('history', messages);
      client.emit('messageHistory', { messages });

      return {
        success: true,
        message: `Joined room ${roomName}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a message to a project room
   */
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    return this.processMessage(client, payload);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    return this.processMessage(client, payload);
  }

  private async processMessage(client: Socket, payload: any) {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const content = payload.content;
    if (typeof content !== 'string') {
      return;
    }

    const trimmed = content.trim();
    if (!trimmed || content.length > 2000) {
      return;
    }

    const user = client.data?.user;
    const userId = user?.userId || user?.sub;
    if (!userId) {
      return;
    }

    const projectId =
      payload.projectId ||
      client.data?.projectId ||
      (client.handshake?.query?.projectId as string);

    if (!projectId) {
      return;
    }

    try {
      // Ignore spoofed senderId; always use authenticated userId
      const message = await this.chatService.sendMessage(
        projectId,
        userId,
        content,
      );

      const roomName = `project:${projectId}`;
      this.server.to(roomName).emit('message', message);
      this.server.to(roomName).emit('newMessage', { message });

      return {
        success: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Leave a project chat room
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const projectId =
      payload?.projectId ||
      client.data.projectId ||
      (client.handshake?.query?.projectId as string);

    if (projectId) {
      const roomName = `project:${projectId}`;
      await client.leave(roomName);
    }

    return {
      success: true,
      message: 'Left room',
    };
  }

  /**
   * Join a 1-on-1 direct message room
   */
  @SubscribeMessage('joinDmRoom')
  async handleJoinDmRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetUserId: string },
  ) {
    if (!payload?.targetUserId) {
      return { success: false, error: 'targetUserId is required' };
    }

    const user = client.data.user;
    const currentUserId = user?.userId || user?.sub;
    if (!currentUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    const roomName = `dm:${[currentUserId, payload.targetUserId].sort().join('_')}`;
    await client.join(roomName);

    const messages = await this.chatService.getDirectMessages(
      currentUserId,
      payload.targetUserId,
      50,
    );

    client.emit('dmHistory', {
      targetUserId: payload.targetUserId,
      messages,
    });

    return {
      success: true,
      roomName,
      messages,
    };
  }

  /**
   * Leave a direct message room
   */
  @SubscribeMessage('leaveDmRoom')
  async handleLeaveDmRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetUserId: string },
  ) {
    const user = client.data.user;
    const currentUserId = user?.userId || user?.sub;
    if (currentUserId && payload?.targetUserId) {
      const roomName = `dm:${[currentUserId, payload.targetUserId].sort().join('_')}`;
      await client.leave(roomName);
    }

    return {
      success: true,
      message: 'Left direct message room',
    };
  }

  /**
   * Send a direct message
   */
  @SubscribeMessage('sendDirectMessage')
  async handleSendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { recipientId: string; content: string; projectId?: string },
  ) {
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid payload' };
    }

    const { recipientId, content, projectId } = payload;
    if (!recipientId || typeof content !== 'string') {
      return { success: false, error: 'recipientId and content are required' };
    }

    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) {
      return { success: false, error: 'Message content is empty or too long' };
    }

    const user = client.data.user;
    const senderId = user?.userId || user?.sub;
    if (!senderId) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const message = await this.chatService.sendDirectMessage(
        senderId,
        recipientId,
        trimmed,
        projectId,
      );

      const roomName = `dm:${[senderId, recipientId].sort().join('_')}`;
      this.server.to(roomName).emit('directMessage', message);
      this.server.to(roomName).emit('newDirectMessage', { message });

      // Notify personal rooms for cross-screen or offline notifications
      this.server.to(`user:${recipientId}`).emit('newDirectMessage', { message });
      this.server.to(`user:${senderId}`).emit('newDirectMessage', { message });

      return {
        success: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

