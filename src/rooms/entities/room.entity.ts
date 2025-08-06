import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConfig } from '../../ai/entities/ai-config.entity';
import { Message } from '../../messages/entities/message.entity';
import { User } from '../../users/entities/user.entity';
import { RoomType } from '../enums/room-type.enum';
import { Invitation } from './invitation.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
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

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @OneToMany(() => Invitation, (invitation) => invitation.room)
  invitations: Invitation[];

  // One-to-one relationship with AiConfig
  @OneToOne(() => AiConfig, (aiConfig) => aiConfig.room, {
    eager: true,
    cascade: true,
  })
  aiConfig: AiConfig;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
