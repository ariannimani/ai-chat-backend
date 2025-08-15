import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { BaseAttachment } from './base-attachment.entity';

@Entity('room_attachments')
export class RoomAttachment extends BaseAttachment {
  @ManyToOne(() => Room, (room) => room.roomAttachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'room_id' })
  @Column({ type: 'uuid', name: 'room_id' })
  room: Room;
}
