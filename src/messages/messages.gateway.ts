import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsExceptionFilter } from 'src/common/errors/ws-exception.filter';
import { WsSupabaseAuthGuard } from 'src/config/guard/ws-jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
@UseFilters(WsExceptionFilter)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(private readonly messagesService: MessagesService) {
    this.messagesService.setGateway(this);
  }

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 New WebSocket connection: ${client.id}`);
      client.emit('connection-success', {
        message: 'Connected to message server',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.emit('connection-error', {
        message: 'Failed to connect',
        error: error.message,
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 WebSocket disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  @UseGuards(WsSupabaseAuthGuard)
  async authenticate(@ConnectedSocket() client: Socket) {
    const user = (client.handshake as any).user;
    this.logger.log(`🔐 Authentication attempt for client: ${client.id}`);

    if (user && user.id) {
      // Join user-specific room for invitations and notifications
      const userRoom = `user:${user.id}`;
      client.join(userRoom);

      this.logger.log(
        `✅ User ${user.email} (ID: ${user.id}) authenticated and joined room: ${userRoom}`,
      );

      client.emit('authenticated', {
        userId: user.id,
        email: user.email,
        userRoom: userRoom,
        message: 'Successfully authenticated and ready to receive invitations',
      });
    } else {
      this.logger.error('❌ Authentication failed - no user data found');
      client.emit('authentication-failed', {
        message: 'Authentication failed',
      });
    }
  }

  @SubscribeMessage('join-room')
  @UseGuards(WsSupabaseAuthGuard)
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`room:${data.roomId}`);
    // Client joined room
    client.emit('joined-room', { roomId: data.roomId });
  }

  @SubscribeMessage('leave-room')
  @UseGuards(WsSupabaseAuthGuard)
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    // Client left room
    client.emit('left-room', { roomId: data.roomId });
  }

  @SubscribeMessage('typing')
  @UseGuards(WsSupabaseAuthGuard)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = (client.handshake as any).user;
    if (!user) {
      client.emit('typing-error', { message: 'User not authenticated' });
      return;
    }

    // User typing in room

    // Broadcast to all clients in the room except the sender
    this.server.to(`room:${data.roomId}`).emit('user-typing', {
      email: user.email,
      userId: user.id,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage('stop-typing')
  @UseGuards(WsSupabaseAuthGuard)
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = (client.handshake as any).user;
    if (!user) {
      client.emit('typing-error', { message: 'User not authenticated' });
      return;
    }

    // User stopped typing

    // Broadcast to all clients in the room except the sender
    this.server.to(`room:${data.roomId}`).emit('user-stopped-typing', {
      userId: user.id,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage('message')
  @UseGuards(WsSupabaseAuthGuard)
  async create(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const user = (client.handshake as any).user;
      const senderId = user?.id;

      // WebSocket message from authenticated user

      if (!senderId) {
        this.logger.error(
          'Authentication failed - no user ID found in handshake',
        );
        client.emit('message-error', {
          message: 'Authentication required',
          error: 'User not found in handshake',
        });
        return;
      }

      await this.messagesService.create(senderId, createMessageDto);

      // Message sent to room
    } catch (error) {
      this.logger.error(`Error creating message: ${error.message}`);
      client.emit('message-error', {
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  /**
   * Broadcast AI response to all users in a room
   * This method can be called from the service
   */
  broadcastAiResponse(roomId: string, aiResponse: any, sender?: any) {
    this.server.to(`room:${roomId}`).emit('new-message', {
      ...aiResponse,
      messageType: 'ai',
      sender: sender
        ? {
            id: sender.id,
            email: sender.email,
          }
        : null,
    });
    // AI response broadcast to room
  }

  broadcastUserMessage(roomId: string, userMessage: any, sender?: any) {
    this.server.to(`room:${roomId}`).emit('new-message', {
      ...userMessage,
      messageType: 'user',
      sender: sender
        ? {
            id: sender.id,
            email: sender.email,
          }
        : null,
    });

    // User message broadcast to room
  }

  broadcastInvitation(userId: string, invitation: any) {
    const userRoom = `user:${userId}`;
    this.logger.log(
      `📨 Broadcasting invitation to ${userRoom} for room "${invitation.roomName}"`,
    );

    // Check if there are clients in the user's personal room
    if (this.server && this.server.sockets && this.server.sockets.adapter) {
      const roomClients = this.server.sockets.adapter.rooms.get(userRoom);
      this.logger.log(
        `👥 Clients in ${userRoom}:`,
        roomClients ? Array.from(roomClients) : 'None',
      );

      if (!roomClients || roomClients.size === 0) {
        this.logger.warn(
          `⚠️ No clients in ${userRoom} - user needs to authenticate first!`,
        );
        return;
      }
    }

    const invitationData = {
      ...invitation,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`📤 Sending new-invitation event to ${userRoom}`);
    this.server.to(userRoom).emit('new-invitation', invitationData);
    this.logger.log(`✅ Invitation sent successfully`);
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('🚀 WebSocket server initialized successfully');
    this.logger.log(`📡 Server instance:`, !!this.server);
    this.logger.log(`🔌 Sockets available:`, !!this.server?.sockets);
    this.logger.log(`🔗 Adapter available:`, !!this.server?.sockets?.adapter);
  }
}
