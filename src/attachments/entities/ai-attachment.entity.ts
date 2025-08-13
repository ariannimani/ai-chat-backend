import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AiConfig } from '../../ai/entities/ai-config.entity';
import { BaseAttachment } from './base-attachment.entity';

@Entity('ai_attachments')
export class AiAttachment extends BaseAttachment {
  @ManyToOne(() => AiConfig, (aiConfig) => aiConfig.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ai_config_id' })
  aiConfig: AiConfig;

  @Column({ name: 'ai_config_id' })
  aiConfigId: string;
}
