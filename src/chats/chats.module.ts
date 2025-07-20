import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../config/supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    AiModule,
    UsersModule,
    SupabaseModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsGateway, ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
