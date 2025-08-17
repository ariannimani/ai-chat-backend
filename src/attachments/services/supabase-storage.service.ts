import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import { AttachmentType, StorageBucket } from '../types/attachment.types';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_JWT_SECRET',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    file: any,
    attachmentType: AttachmentType,
    roomId: string,
    _userId: string,
  ): Promise<{ path: string; url: string }> {
    try {
      const bucket = this.getBucketForType(attachmentType);
      const filePath = this.generateFilePath(
        attachmentType,
        roomId,
        file.originalname,
      );

      const { data: _data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          duplex: 'replace', // Replace if file already exists
        });

      if (error) {
        this.logger.error(`Failed to upload file: ${error.message}`);
        throw new Error(error.message);
      }

      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      this.logger.log(
        `📤 File uploaded to Supabase: ${filePath} in bucket ${bucket}`,
      );

      return {
        path: filePath,
        url: urlData.publicUrl,
      };
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download file from Supabase storage
   */
  async downloadFile(
    storagePath: string,
    attachmentType: AttachmentType,
  ): Promise<Buffer> {
    try {
      const bucket = this.getBucketForType(attachmentType);

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(storagePath);

      if (error) {
        this.logger.error(`Failed to download file: ${error.message}`);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No file data received');
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      this.logger.error(`Download error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(
    storagePath: string,
    attachmentType: AttachmentType,
  ): Promise<void> {
    try {
      const bucket = this.getBucketForType(attachmentType);

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (error) {
        this.logger.error(`Failed to delete file: ${error.message}`);
        throw new Error(error.message);
      }

      this.logger.log(
        `🗑️ File deleted from Supabase: ${storagePath} in bucket ${bucket}`,
      );
    } catch (error) {
      this.logger.error(`Delete error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file content as text (for AI processing)
   */
  async getFileContent(
    storagePath: string,
    attachmentType: AttachmentType,
    _mimeType: string,
  ): Promise<string> {
    try {
      const buffer = await this.downloadFile(storagePath, attachmentType);
      const fileExtension = path.extname(storagePath).toLowerCase();

      // Handle different file types
      switch (fileExtension) {
        case '.txt':
        case '.md':
        case '.json':
        case '.csv':
        case '.xml':
          return buffer.toString('utf8');
        case '.pdf':
          // For PDF files, we'll add a placeholder for now
          // In production, you might want to use a PDF parser like pdf-parse
          return `[PDF Content: ${path.basename(storagePath)} - Content extraction not implemented]`;
        case '.doc':
        case '.docx':
          // For Word documents, we'll add a placeholder for now
          // In production, you might want to use a library like mammoth
          return `[Document Content: ${path.basename(storagePath)} - Content extraction not implemented]`;
        default:
          return `[File: ${path.basename(storagePath)} - Content type not supported for reading]`;
      }
    } catch (error) {
      this.logger.error(`Error reading file content: ${error.message}`);
      return `[Error reading file content: ${error.message}]`;
    }
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(
    storagePath: string,
    attachmentType: AttachmentType,
  ): Promise<boolean> {
    try {
      const bucket = this.getBucketForType(attachmentType);

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path.dirname(storagePath), {
          search: path.basename(storagePath),
        });

      if (error) {
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      this.logger.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Get bucket name for attachment type
   */
  private getBucketForType(attachmentType: AttachmentType): string {
    switch (attachmentType) {
      case AttachmentType.AI_CONFIG:
        return StorageBucket.CHAT_AI_DOCUMENTS;
      case AttachmentType.ROOM_FILE:
        return StorageBucket.USER_DOCUMENTS;
      default:
        throw new Error(`Unknown attachment type: ${attachmentType}`);
    }
  }

  /**
   * Generate file path with room folder structure
   */
  private generateFilePath(
    attachmentType: AttachmentType,
    roomId: string,
    originalName: string,
  ): string {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${timestamp}-${randomSuffix}-${safeBaseName}${fileExtension}`;

    return `${roomId}/${filename}`;
  }
}
