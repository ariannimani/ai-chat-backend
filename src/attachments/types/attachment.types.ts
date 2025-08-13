export enum AttachmentType {
  AI_CONFIG = 'ai_config',
  ROOM_FILE = 'room_file',
}

export enum StorageBucket {
  CHAT_AI_DOCUMENTS = 'chat-ai-documents',
  USER_DOCUMENTS = 'user-documents',
}

export interface AttachmentConfig {
  type: AttachmentType;
  bucket: StorageBucket;
  maxSize: number;
  allowedMimeTypes: string[];
}

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface FileDownloadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

export const ATTACHMENT_CONFIGS: Record<AttachmentType, AttachmentConfig> = {
  [AttachmentType.AI_CONFIG]: {
    type: AttachmentType.AI_CONFIG,
    bucket: StorageBucket.CHAT_AI_DOCUMENTS,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json',
      'application/xml',
      'text/xml',
    ],
  },
  [AttachmentType.ROOM_FILE]: {
    type: AttachmentType.ROOM_FILE,
    bucket: StorageBucket.USER_DOCUMENTS,
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      // Documents
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'application/json',
      'application/xml',
      'text/xml',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ],
  },
};
