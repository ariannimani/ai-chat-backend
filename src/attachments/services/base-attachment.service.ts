import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseAttachment } from '../entities/base-attachment.entity';
import {
  ATTACHMENT_CONFIGS,
  AttachmentType,
  FileDownloadResult,
} from '../types/attachment.types';
import { SupabaseStorageService } from './supabase-storage.service';

export interface AttachmentUploadDto {
  description?: string;
}

export interface AttachmentResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  storageUrl: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export abstract class BaseAttachmentService<T extends BaseAttachment> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly userRepository: Repository<User>,
    protected readonly storageService: SupabaseStorageService,
    protected readonly attachmentType: AttachmentType,
  ) {}

  /**
   * Upload attachment
   */
  async uploadAttachment(
    roomId: string,
    userId: string,
    file: any,
    uploadDto: AttachmentUploadDto,
  ): Promise<AttachmentResponseDto> {
    // Validate file
    this.validateFile(file);

    // Check user access to room
    await this.checkUserAccess(roomId, userId);

    // Find user
    const user = await this.findUser(userId);

    try {
      // Upload to Supabase storage
      const { path: storagePath, url: storageUrl } =
        await this.storageService.uploadFile(
          file,
          this.attachmentType,
          roomId,
          userId,
        );

      // Create attachment record
      const attachment = await this.createAttachmentRecord({
        filename: this.generateFileName(file.originalname),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath,
        storageUrl,
        type: this.attachmentType,
        description: uploadDto.description,
        roomId,
        uploadedById: userId,
        uploadedBy: user,
      } as Partial<T>);

      this.logger.log(
        `📎 ${this.attachmentType} attachment "${file.originalname}" uploaded by ${user.email}`,
      );

      return this.mapToResponseDto(attachment);
    } catch (error) {
      this.logger.error(`Failed to upload attachment: ${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Get attachments for a room
   */
  async getAttachments(
    roomId: string,
    userId: string,
  ): Promise<AttachmentResponseDto[]> {
    await this.checkUserAccess(roomId, userId);

    const attachments = await this.repository.find({
      where: { roomId } as any,
      order: { createdAt: 'DESC' } as any,
    });

    return attachments.map((attachment) => this.mapToResponseDto(attachment));
  }

  /**
   * Download attachment
   */
  async downloadAttachment(
    attachmentId: string,
    userId: string,
  ): Promise<FileDownloadResult> {
    const attachment = await this.findAttachment(attachmentId);

    await this.checkUserAccess(attachment.roomId, userId);

    try {
      const buffer = await this.storageService.downloadFile(
        attachment.storagePath,
        this.attachmentType,
      );

      return {
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        buffer,
      };
    } catch (error) {
      this.logger.error(`Failed to download attachment: ${error.message}`);
      throw new NotFoundException('File not found or inaccessible');
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    attachmentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const attachment = await this.findAttachment(attachmentId);

    await this.checkUserAccess(attachment.roomId, userId);
    await this.checkDeletePermission(attachment, userId);

    try {
      // Delete from storage
      await this.storageService.deleteFile(
        attachment.storagePath,
        this.attachmentType,
      );

      // Delete from database
      await this.repository.remove(attachment);

      this.logger.log(
        `🗑️ ${this.attachmentType} attachment "${attachment.originalName}" deleted by user ${userId}`,
      );

      return { message: 'Attachment deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete attachment: ${error.message}`);
      throw new BadRequestException('Failed to delete attachment');
    }
  }

  /**
   * Get attachment content for AI processing
   */
  async getAttachmentContent(attachmentId: string): Promise<string> {
    const attachment = await this.findAttachment(attachmentId);

    try {
      return await this.storageService.getFileContent(
        attachment.storagePath,
        this.attachmentType,
        attachment.mimeType,
      );
    } catch (error) {
      this.logger.error(`Failed to read attachment content: ${error.message}`);
      return `[Error reading attachment: ${attachment.originalName}]`;
    }
  }

  /**
   * Abstract methods to be implemented by concrete services
   */
  protected abstract checkUserAccess(
    roomId: string,
    userId: string,
  ): Promise<void>;
  protected abstract checkDeletePermission(
    attachment: T,
    userId: string,
  ): Promise<void>;
  protected abstract createAttachmentRecord(data: Partial<T>): Promise<T>;

  /**
   * Validate uploaded file
   */
  protected validateFile(file: any): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const config = ATTACHMENT_CONFIGS[this.attachmentType];

    // Check file size
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new BadRequestException(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not supported. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Find user by ID
   */
  protected async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find attachment by ID
   */
  protected async findAttachment(attachmentId: string): Promise<T> {
    const attachment = await this.repository.findOne({
      where: { id: attachmentId } as any,
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  /**
   * Generate unique filename
   */
  protected generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomSuffix}.${extension}`;
  }

  /**
   * Map attachment entity to response DTO
   */
  protected mapToResponseDto(attachment: T): AttachmentResponseDto {
    return {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      description: attachment.description,
      storageUrl: attachment.storageUrl,
      uploadedBy: {
        id: attachment.uploadedBy.id,
        name: attachment.uploadedBy.name,
        email: attachment.uploadedBy.email,
      },
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }
}
