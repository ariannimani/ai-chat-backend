import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from 'src/messages/messages.module';
import { AiModule } from '../ai/ai.module';
import { AiConfig } from '../ai/entities/ai-config.entity';
import { User } from '../users/entities/user.entity';
import { Invitation } from './entities/invitation.entity';
import { Room } from './entities/room.entity';
import { InvitationsController } from './invitations.controller';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Invitation, User, AiConfig]),
    MessagesModule,
    AiModule,
  ],
  controllers: [RoomsController, InvitationsController],
  providers: [RoomsService],
})
export class RoomsModule {}
