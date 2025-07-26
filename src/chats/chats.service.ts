import { Injectable, Logger } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository, LessThan } from 'typeorm';
import { GetChatDto } from './dto/get-chat.dto';
import { SupabaseService } from '../config/supabase/supabase.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);
  private chatsGateway: any; // We'll set this via setter to avoid circular dependency

  constructor(
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    private supabaseService: SupabaseService,
    private aiService: AiService,
    private usersService: UsersService,
  ) {}

  setGateway(gateway: any) {
    this.chatsGateway = gateway;
  }

  async create(senderId: string, createChatDto: CreateChatDto) {
    // Note: Room must exist in database before creating chats

    const chatData = {
      ...createChatDto,
      sender_id: senderId,
      room_id: createChatDto.room_id,
      isAiResponse: false, // This is a user message
    };

    const chat = this.chatRepository.create(chatData);
    const savedChat = await this.chatRepository.save(chat);

    // Optional: Publish to Supabase realtime for additional real-time features
    try {
      const supabase = this.supabaseService.getClient();
      await supabase.channel(`room:${createChatDto.room_id}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: savedChat,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to broadcast message via Supabase:',
        error.message,
      );
    }

    // Only generate AI response if messageType is 'ai'
    if (createChatDto.messageType === 'ai') {
      try {
        // Generate AI response immediately but with proper sequencing
        await this.generateAiResponse(savedChat);
      } catch (error) {
        this.logger.error(`Failed to generate AI response: ${error.message}`);
      }
    }

    return savedChat;
  }

  /**
   * Generate an AI response to a user message
   */
  private async generateAiResponse(userChat: Chat): Promise<Chat | null> {
    try {
      // Get user information
      const user = await this.usersService.findOne(userChat.sender_id);
      if (!user) {
        this.logger.error(`User not found: ${userChat.sender_id}`);
        return null;
      }

      // Generate AI response using the AI service
      const aiResponseText = await this.aiService.generateResponse(
        userChat.room_id,
        user.id,
        user.username,
        userChat.content,
      );

      // Create AI response chat message
      const aiChatData = {
        content: aiResponseText,
        sender_id: userChat.sender_id, // We'll use the same sender for simplicity, but mark as AI
        room_id: userChat.room_id,
        isAiResponse: true, // This is an AI response
      };

      const aiChat = this.chatRepository.create(aiChatData);
      const savedAiChat = await this.chatRepository.save(aiChat);

      // Broadcast AI response via WebSocket Gateway
      if (this.chatsGateway) {
        try {
          this.chatsGateway.broadcastAiResponse(userChat.room_id, savedAiChat);
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
        await supabase.channel(`room:${userChat.room_id}`).send({
          type: 'broadcast',
          event: 'ai_response',
          payload: savedAiChat,
        });
      } catch (error) {
        this.logger.warn(
          'Failed to broadcast AI response via Supabase:',
          error.message,
        );
      }

      this.logger.log(
        `Generated AI response for room ${userChat.room_id}, user ${user.username}`,
      );

      return savedAiChat;
    } catch (error) {
      this.logger.error(
        `Failed to generate AI response: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async findAll(roomId: string, getChatDto: GetChatDto) {
    const whereCondition: any = {
      room_id: roomId,
    };

    if (getChatDto.last_id) {
      whereCondition.id = LessThan(getChatDto.last_id);
    }

    return await this.chatRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: getChatDto.limit,
      relations: ['sender'],
    });
  }

  // Supabase real-time subscription helper for chat rooms
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
