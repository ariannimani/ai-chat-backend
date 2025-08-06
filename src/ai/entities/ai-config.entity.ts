import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { AiProvider } from '../ai-provider.interface';

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AiProvider,
    default: AiProvider.GROQ,
    nullable: false,
  })
  provider: AiProvider;

  @Column({
    default: 'llama3-70b-8192',
    nullable: false,
  })
  model: string;

  @Column({ nullable: true })
  instructions: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.7,
    nullable: true,
  })
  temperature: number;

  @Column({
    type: 'int',
    default: 1000,
    nullable: true,
  })
  max_tokens: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
    nullable: true,
  })
  top_p: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
    nullable: true,
  })
  frequency_penalty: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
    nullable: true,
  })
  presence_penalty: number;

  // One-to-one relationship with Room
  @OneToOne(() => Room, (room) => room.aiConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to convert to room config format
  toRoomConfig() {
    return {
      ai_provider: this.provider,
      ai_model: this.model,
      ai_instructions: this.instructions,
      ai_temperature: this.temperature ? Number(this.temperature) : undefined,
      ai_max_tokens: this.max_tokens ? Number(this.max_tokens) : undefined,
      ai_top_p: this.top_p ? Number(this.top_p) : undefined,
      ai_frequency_penalty: this.frequency_penalty
        ? Number(this.frequency_penalty)
        : undefined,
      ai_presence_penalty: this.presence_penalty
        ? Number(this.presence_penalty)
        : undefined,
    };
  }
}
