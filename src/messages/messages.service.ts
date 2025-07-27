import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { SupabaseService } from '../config/supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessageDto } from './dto/get-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  private messagesGateway: any; // We'll set this via setter to avoid circular dependency

  constructor(
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    private supabaseService: SupabaseService,
    private aiService: AiService,
    private usersService: UsersService,
  ) {}

  setGateway(gateway: any) {
    this.messagesGateway = gateway;
  }

  async create(senderId: string, createMessageDto: CreateMessageDto) {
    // Note: Room must exist in database before creating messages

    const messageData = {
      ...createMessageDto,
      sender_id: senderId,
      room_id: createMessageDto.room_id,
      sender_type: 'user' as const, // This is a user message
    };

    const message = this.messageRepository.create(messageData);
    const savedMessage = await this.messageRepository.save(message);

    // Optional: Publish to Supabase realtime for additional real-time features
    try {
      const supabase = this.supabaseService.getClient();
      await supabase.channel(`room:${createMessageDto.room_id}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: savedMessage,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to broadcast message via Supabase:',
        error.message,
      );
    }

    // Only generate AI response if messageType is 'ai'
    if (createMessageDto.messageType === 'ai') {
      try {
        // Generate AI response immediately but with proper sequencing
        await this.generateAiResponse(savedMessage);
      } catch (error) {
        this.logger.error(`Failed to generate AI response: ${error.message}`);
      }
    }

    return savedMessage;
  }

  /**
   * Generate an AI response to a user message
   */
  private async generateAiResponse(
    userMessage: Message,
  ): Promise<Message | null> {
    try {
      // Get user information
      const user = await this.usersService.findOne(userMessage.sender_id);
      if (!user) {
        this.logger.error(`User not found: ${userMessage.sender_id}`);
        return null;
      }

      // Generate AI response using the AI service
      const aiResponseText = await this.aiService.generateResponse(
        userMessage.room_id,
        user.id,
        user.username,
        userMessage.content,
      );

      // Create AI response message
      const aiMessageData = {
        content: aiResponseText,
        sender_id: userMessage.sender_id, // We'll use the same sender for simplicity, but mark as AI
        room_id: userMessage.room_id,
        sender_type: 'ai' as const, // This is an AI response
      };

      const aiMessage = this.messageRepository.create(aiMessageData);
      const savedAiMessage = await this.messageRepository.save(aiMessage);

      // Broadcast AI response via WebSocket Gateway
      if (this.messagesGateway) {
        try {
          this.messagesGateway.broadcastAiResponse(
            userMessage.room_id,
            savedAiMessage,
          );
        } catch (error) {
          this.logger.warn(
            'Failed to broadcast AI response via WebSocket:',
            error.message,
          );
        }
      }

      // Also broadcast via Supabase for additional real-time features
      try {
        const supabase = this.supabaseService.getClient();
        await supabase.channel(`room:${userMessage.room_id}`).send({
          type: 'broadcast',
          event: 'ai_response',
          payload: savedAiMessage,
        });
      } catch (error) {
        this.logger.warn(
          'Failed to broadcast AI response via Supabase:',
          error.message,
        );
      }

      this.logger.log(
        `Generated AI response for room ${userMessage.room_id}, user ${user.username}`,
      );

      return savedAiMessage;
    } catch (error) {
      this.logger.error(
        `Failed to generate AI response: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async findAll(roomId: string, getMessageDto: GetMessageDto) {
    const whereCondition: any = {
      room_id: roomId,
    };

    if (getMessageDto.last_id) {
      whereCondition.id = LessThan(getMessageDto.last_id);
    }

    return await this.messageRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: getMessageDto.limit,
      relations: ['sender'],
    });
  }

  // Supabase real-time subscription helper for message rooms
  subscribeToRoom(roomId: string, callback: (payload: any) => void) {
    try {
      const supabase = this.supabaseService.getClient();
      const channel = supabase
        .channel(`room:${roomId}`)
        .on('broadcast', { event: 'new_message' }, callback)
        .subscribe();

      this.logger.log(`Subscribed to room: ${roomId}`);
      return channel;
    } catch (error) {
      this.logger.error('Failed to subscribe to room:', error.message);
      return null;
    }
  }

  // Unsubscribe from room
  unsubscribeFromRoom(channel: any) {
    try {
      if (channel) {
        this.supabaseService.getClient().removeChannel(channel);
        this.logger.log('Unsubscribed from room');
      }
    } catch (error) {
      this.logger.error('Failed to unsubscribe from room:', error.message);
    }
  }
}
