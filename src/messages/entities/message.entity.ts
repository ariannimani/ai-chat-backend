import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
export class Message {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ type: 'enum', enum: ['user', 'ai', 'system'] })
  sender_type: 'user' | 'ai' | 'system';

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  sender_id: string;

  @ManyToOne(() => Room, (room) => room.messages)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column()
  room_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
