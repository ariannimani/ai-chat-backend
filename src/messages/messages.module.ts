import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { AiConfig } from '../ai/entities/ai-config.entity';
import { SupabaseModule } from '../config/supabase/supabase.module';
import { Room } from '../rooms/entities/room.entity';
import { UsersModule } from '../users/users.module';
import { Message } from './entities/message.entity';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room, AiConfig]),
    AiModule,
    UsersModule,
    SupabaseModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
