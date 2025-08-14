import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AiProviderFactory } from '../ai/ai-provider.factory';
import { AiProvider } from '../ai/ai-provider.interface';
import { AiService } from '../ai/ai.service';
import { AiConfig } from '../ai/entities/ai-config.entity';
import { SupabaseService } from '../config/supabase/supabase.service';
import { Room } from '../rooms/entities/room.entity';
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
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(AiConfig)
    private aiConfigRepository: Repository<AiConfig>,
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
      id: createMessageDto.id,
      content: createMessageDto.content,
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

    if (this.messagesGateway) {
      this.messagesGateway.broadcastUserMessage(
        createMessageDto.room_id,
        senderId,
        savedMessage,
      );
    }

    // Only generate AI response if messageType is 'ai'
    if (createMessageDto.messageType === 'ai') {
      try {
        // Generate AI response immediately but with proper sequencing
        await this.generateAiResponse(savedMessage);
      } catch (error) {
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
    }
  }

  /**
   * Generate an AI response to a user message
   * Updated to work with separate AiConfig entity and preserve conversation history
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

      // Get room and its AI configuration (force fresh read from database)
      const room = await this.roomRepository.findOne({
        where: { id: userMessage.room_id },
        relations: ['aiConfig'],
        cache: false, // Disable caching to ensure fresh data
      });

      if (!room) {
        this.logger.error(`Room not found: ${userMessage.room_id}`);
        return null;
      }

      let aiConfig = room.aiConfig;

      // Debug: Log what AI config we actually loaded
      this.logger.log(
        `🔍 Loaded AI config for room ${userMessage.room_id}: ${aiConfig ? `${aiConfig.provider}/${aiConfig.model}` : 'null'}`,
      );

      // Create default AI config if it doesn't exist
      if (!aiConfig) {
        this.logger.log(`Creating default AI config for room ${room.id}`);
        const defaultConfig = AiProviderFactory.getDefaultConfig(
          AiProvider.GROQ,
        );

        aiConfig = this.aiConfigRepository.create({
          roomId: room.id,
          provider: AiProvider.GROQ,
          model: defaultConfig.model || 'llama3-70b-8192',
          instructions: room.aiConfig.instructions,
          temperature: defaultConfig.temperature || 0.7,
          max_tokens: defaultConfig.maxTokens || 1000,
          top_p: defaultConfig.topP || 1.0,
          frequency_penalty: defaultConfig.frequencyPenalty || 0.0,
          presence_penalty: defaultConfig.presencePenalty || 0.0,
        });

        aiConfig = await this.aiConfigRepository.save(aiConfig);
      }

      // Generate AI response using the AI service with room's AI configuration
      // The AI service will maintain conversation history regardless of model changes
      const roomConfig = aiConfig.toRoomConfig();

      // Debug: Log the exact config being used
      this.logger.log(
        `🔧 Using AI config for room ${userMessage.room_id}: ${JSON.stringify({
          provider: roomConfig.ai_provider,
          model: roomConfig.ai_model,
          temperature: roomConfig.ai_temperature,
        })}`,
      );

      const aiResponseText = await this.aiService.generateResponse(
        userMessage.room_id,
        user.id,
        user.username,
        userMessage.content,
        roomConfig, // Convert AiConfig to the expected format
      );

      // Create AI response message
      const aiMessageData = {
        id: uuidv4(),
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
        `✅ Generated AI response for message ${userMessage.id} in room ${userMessage.room_id} using ${aiConfig.provider}/${aiConfig.model}`,
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

  async getByRoomId(
    roomId: string,
    userId: string,
    getMessageDto: GetMessageDto,
  ) {
    // First check if user has access to the room
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    const isMember = room.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new Error('Access denied to this room');
    }

    const { limit = 50, last_id } = getMessageDto;

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.room_id = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    if (last_id) {
      queryBuilder.andWhere('message.id < :lastId', {
        lastId: last_id,
      });
    }

    const messages = await queryBuilder.getMany();

    this.logger.log(
      `📨 Retrieved ${messages.length} messages for room ${roomId}`,
    );

    return messages.reverse(); // Return in chronological order
  }

  async findAll(roomId: string, dto: GetMessageDto) {
    const { limit, last_id } = dto;

    let queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.room_id = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    if (last_id) {
      queryBuilder = queryBuilder.andWhere('message.id < :lastId', {
        lastId: last_id,
      });
    }

    const messages = await queryBuilder.getMany();
    return messages.reverse(); // Return in chronological order
  }

  // Cleanup old messages (can be called via cron job)
  async cleanupOldMessages(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.messageRepository.delete({
      createdAt: LessThan(cutoffDate),
    });

    this.logger.log(
      `🧹 Cleaned up ${result.affected} messages older than ${daysToKeep} days`,
    );

    return result;
  }
}
