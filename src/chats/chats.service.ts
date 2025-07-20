import { Injectable, Logger } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository, LessThan } from 'typeorm';
import { GetChatDto } from './dto/get-chat.dto';
import { SupabaseService } from '../config/supabase/supabase.service';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    private supabaseService: SupabaseService,
  ) {}

  async create(senderId: string, createChatDto: CreateChatDto) {
    const chatData = {
      ...createChatDto,
      sender_id: senderId,
      room_id: createChatDto.room_id,
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

    return savedChat;
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
