import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConfig } from '../../ai/entities/ai-config.entity';
import { RoomAttachment } from '../../attachments/entities/room-attachment.entity';
import { Message } from '../../messages/entities/message.entity';
import { User } from '../../users/entities/user.entity';
import { RoomType } from '../enums/room-type.enum';
import { Invitation } from './invitation.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.PERSONAL,
  })
  type: RoomType;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'room_members',
    joinColumn: {
      name: 'room_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @OneToMany(() => Invitation, (invitation) => invitation.room)
  invitations: Invitation[];

  @OneToMany(() => RoomAttachment, (attachment) => attachment.room, {
    cascade: true,
  })
  roomAttachments: RoomAttachment[];

  // One-to-one relationship with AiConfig
  @OneToOne(() => AiConfig, (aiConfig) => aiConfig.room, {
    eager: true,
    cascade: true,
  })
  aiConfig: AiConfig;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
