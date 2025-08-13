import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConfig } from '../../ai/entities/ai-config.entity';
import { User } from '../../users/entities/user.entity';
import { AiAttachment } from '../entities/ai-attachment.entity';
import { AttachmentType } from '../types/attachment.types';
import { BaseAttachmentService } from './base-attachment.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class AiAttachmentService extends BaseAttachmentService<AiAttachment> {
  constructor(
    @InjectRepository(AiAttachment)
    repository: Repository<AiAttachment>,
    @InjectRepository(User)
    userRepository: Repository<User>,
    @InjectRepository(AiConfig)
    private aiConfigRepository: Repository<AiConfig>,
    storageService: SupabaseStorageService,
  ) {
    super(repository, userRepository, storageService, AttachmentType.AI_CONFIG);
  }

  /**
   * Get all AI attachments for a room (for AI processing)
   */
  async getAiAttachmentsContent(roomId: string): Promise<string> {
    const attachments = await this.repository.find({
      where: { roomId } as any,
      order: { createdAt: 'ASC' } as any,
    });

    if (attachments.length === 0) {
      return '';
    }

    const attachmentContents: string[] = [];

    for (const attachment of attachments) {
      try {
        const content = await this.storageService.getFileContent(
          attachment.storagePath,
          this.attachmentType,
          attachment.mimeType,
        );

        if (content.trim()) {
          attachmentContents.push(
            `--- AI Config File: ${attachment.originalName} ---\n${
              attachment.description
                ? `Description: ${attachment.description}\n`
                : ''
            }${content}\n--- End of ${attachment.originalName} ---`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error reading AI attachment ${attachment.originalName}: ${error.message}`,
        );
        attachmentContents.push(
          `--- AI Config File: ${attachment.originalName} ---\nError reading file content\n--- End of ${attachment.originalName} ---`,
        );
      }
    }

    if (attachmentContents.length > 0) {
      return `\n\n=== AI CONFIG ATTACHMENTS ===\n${attachmentContents.join('\n\n')}\n=== END AI CONFIG ATTACHMENTS ===\n`;
    }

    return '';
  }

  protected async checkUserAccess(
    roomId: string,
    userId: string,
  ): Promise<void> {
    const aiConfig = await this.aiConfigRepository.findOne({
      where: { roomId },
      relations: ['room', 'room.members'],
    });

    if (!aiConfig) {
      throw new NotFoundException('Room AI configuration not found');
    }

    const isMember = aiConfig.room.members.some(
      (member) => member.id === userId,
    );
    if (!isMember) {
      throw new BadRequestException('Access denied: Not a room member');
    }
  }

  protected async checkDeletePermission(
    attachment: AiAttachment,
    userId: string,
  ): Promise<void> {
    const aiConfig = await this.aiConfigRepository.findOne({
      where: { roomId: attachment.roomId },
      relations: ['room', 'room.admin'],
    });

    if (!aiConfig) {
      throw new NotFoundException('AI configuration not found');
    }

    const isUploader = attachment.uploadedById === userId;
    const isAdmin = aiConfig.room.admin?.id === userId;

    if (!isUploader && !isAdmin) {
      throw new BadRequestException(
        'Access denied: Only the uploader or room admin can delete AI config attachments',
      );
    }
  }

  protected async createAttachmentRecord(
    data: Partial<AiAttachment>,
  ): Promise<AiAttachment> {
    // Find AI config for the room
    const aiConfig = await this.aiConfigRepository.findOne({
      where: { roomId: data.roomId },
    });

    if (!aiConfig) {
      throw new NotFoundException('AI configuration not found');
    }

    const attachment = this.repository.create({
      ...data,
      aiConfig,
      aiConfigId: aiConfig.id,
    });

    return this.repository.save(attachment);
  }
}
