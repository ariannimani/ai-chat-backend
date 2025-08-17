import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  code: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @ManyToOne(() => Room, { eager: true })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'invited_user_id' })
  invitedUser: User;

  @Column({ type: 'text', nullable: true })
  invitedEmail: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
