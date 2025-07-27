import { Logger, UseGuards } from '@nestjs/common';
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
import { WsSupabaseAuthGuard } from 'src/config/guard/ws-jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@WebSocketGateway(parseInt(process.env.WS_PORT) || 8080, {
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
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
      this.logger.log(
        `Client connected: ${client.id} from ${client.handshake.address}`,
      );
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
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  @UseGuards(WsSupabaseAuthGuard)
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`room:${data.roomId}`);
    this.logger.log(`Client ${client.id} joined room: room:${data.roomId}`);
    client.emit('joined-room', { roomId: data.roomId });
  }

  @SubscribeMessage('leave-room')
  @UseGuards(WsSupabaseAuthGuard)
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    this.logger.log(`Client ${client.id} left room: room:${data.roomId}`);
    client.emit('left-room', { roomId: data.roomId });
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

      this.logger.debug(`WebSocket user object:`, user);
      this.logger.debug(`Extracted sender ID: ${senderId}`);

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

      const message = await this.messagesService.create(
        senderId,
        createMessageDto,
      );

      // Emit the user message to all clients in the room
      // Keep the original messageType from the DTO ('message' or 'ai')
      this.server.to(`room:${createMessageDto.room_id}`).emit('new-message', {
        ...message,
        messageType: createMessageDto.messageType || 'message',
      });

      this.logger.log(
        `Message sent to room ${createMessageDto.room_id} by user ${senderId}`,
      );

      // Note: AI response will be handled asynchronously in the service
      // and broadcast separately when ready
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
  broadcastAiResponse(roomId: string, aiResponse: any) {
    this.server.to(`room:${roomId}`).emit('new-message', {
      ...aiResponse,
      // Don't override messageType - use the isAiResponse field to identify AI responses
    });
    this.logger.log(`AI response broadcast to room: ${roomId}`);
  }

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }
}
