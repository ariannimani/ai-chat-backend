import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConfig } from '../ai/entities/ai-config.entity';
import { Room } from '../rooms/entities/room.entity';
import { User } from '../users/entities/user.entity';
import { AiAttachmentController } from './controllers/ai-attachment.controller';
import { RoomAttachmentController } from './controllers/room-attachment.controller';
import { AiAttachment } from './entities/ai-attachment.entity';
import { RoomAttachment } from './entities/room-attachment.entity';
import { AiAttachmentService } from './services/ai-attachment.service';
import { RoomAttachmentService } from './services/room-attachment.service';
import { SupabaseStorageService } from './services/supabase-storage.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AiAttachment,
      RoomAttachment,
      User,
      Room,
      AiConfig,
    ]),
  ],
  controllers: [AiAttachmentController, RoomAttachmentController],
  providers: [
    SupabaseStorageService,
    AiAttachmentService,
    RoomAttachmentService,
  ],
  exports: [AiAttachmentService, RoomAttachmentService, SupabaseStorageService],
})
export class AttachmentsModule {}
