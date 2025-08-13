import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AttachmentType } from '../types/attachment.types';

export abstract class BaseAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  storagePath: string;

  @Column()
  storageUrl: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
  })
  type: AttachmentType;

  @Column({ nullable: true })
  description: string;

  @Column()
  roomId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
