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
    // Set the gateway reference in the service to enable broadcasting
    this.messagesService.setGateway(this);
  }

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    try {
      // Client connected
      // No authentication during connection - it happens per-message
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
    // Client disconnected
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

  afterInit() {
    // WebSocket server initialized
  }
}
