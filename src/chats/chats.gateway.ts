import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsSupabaseAuthGuard } from 'src/config/guard/ws-jwt-auth.guard';

@WebSocketGateway(parseInt(process.env.WS_PORT) || 8080, {
  namespace: '/chats',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);

  constructor(private readonly chatsService: ChatsService) {
    // Set the gateway reference in the service to enable broadcasting
    this.chatsService.setGateway(this);
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
        message: 'Connected to chat server',
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

  @SubscribeMessage('create')
  @UseGuards(WsSupabaseAuthGuard)
  async create(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChatDto: CreateChatDto,
  ) {
    try {
      const senderId = (client.handshake as any).user?.sub;
      if (!senderId) {
        client.emit('chat-error', {
          message: 'Authentication required',
          error: 'User not found in handshake',
        });
        return;
      }

      const chat = await this.chatsService.create(senderId, createChatDto);

      // Emit the user message to all clients in the room
      // Keep the original messageType from the DTO ('chat' or 'ai')
      this.server.to(`room:${createChatDto.room_id}`).emit('new-chat', {
        ...chat,
        messageType: createChatDto.messageType || 'chat',
      });

      this.logger.log(
        `Message sent to room ${createChatDto.room_id} by user ${senderId}`,
      );

      // Note: AI response will be handled asynchronously in the service
      // and broadcast separately when ready
    } catch (error) {
      this.logger.error(`Error creating chat: ${error.message}`);
      client.emit('chat-error', {
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
    this.server.to(`room:${roomId}`).emit('new-chat', {
      ...aiResponse,
      // Don't override messageType - use the isAiResponse field to identify AI responses
    });
    this.logger.log(`AI response broadcast to room: ${roomId}`);
  }

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }
}
