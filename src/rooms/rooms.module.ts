import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from 'src/messages/messages.module';
import { User } from '../users/entities/user.entity';
import { Invitation } from './entities/invitation.entity';
import { Room } from './entities/room.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Invitation, User]), MessagesModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
