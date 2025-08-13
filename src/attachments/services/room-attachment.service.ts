import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';
import { RoomAttachment } from '../entities/room-attachment.entity';
import { AttachmentType } from '../types/attachment.types';
import { BaseAttachmentService } from './base-attachment.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class RoomAttachmentService extends BaseAttachmentService<RoomAttachment> {
  constructor(
    @InjectRepository(RoomAttachment)
    repository: Repository<RoomAttachment>,
    @InjectRepository(User)
    userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    storageService: SupabaseStorageService,
  ) {
    super(repository, userRepository, storageService, AttachmentType.ROOM_FILE);
  }

  protected async checkUserAccess(
    roomId: string,
    userId: string,
  ): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isMember = room.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new BadRequestException('Access denied: Not a room member');
    }
  }

  protected async checkDeletePermission(
    attachment: RoomAttachment,
    userId: string,
  ): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: attachment.roomId },
      relations: ['admin'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isUploader = attachment.uploadedById === userId;
    const isAdmin = room.admin?.id === userId;

    if (!isUploader && !isAdmin) {
      throw new BadRequestException(
        'Access denied: Only the uploader or room admin can delete room attachments',
      );
    }
  }

  protected async createAttachmentRecord(
    data: Partial<RoomAttachment>,
  ): Promise<RoomAttachment> {
    // Find room
    const room = await this.roomRepository.findOne({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const attachment = this.repository.create({
      ...data,
      room,
    });

    return this.repository.save(attachment);
  }
}
