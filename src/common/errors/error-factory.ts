import { HttpStatus } from '@nestjs/common';
import { AppError } from './app-error.class';
import { ErrorCode } from './error-codes.enum';

export class ErrorFactory {
  // Authentication errors
  static invalidCredentials(details?: any): AppError {
    return new AppError(
      'Invalid credentials provided',
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      HttpStatus.UNAUTHORIZED,
      true,
      details,
    );
  }

  static tokenExpired(details?: any): AppError {
    return new AppError(
      'Authentication token has expired',
      ErrorCode.AUTH_TOKEN_EXPIRED,
      HttpStatus.UNAUTHORIZED,
      true,
      details,
    );
  }

  static insufficientPermissions(details?: any): AppError {
    return new AppError(
      'Insufficient permissions to perform this action',
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      HttpStatus.FORBIDDEN,
      true,
      details,
    );
  }

  // User errors
  static userNotFound(userId?: string): AppError {
    return new AppError(
      userId ? `User with ID ${userId} not found` : 'User not found',
      ErrorCode.USER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      true,
      { userId },
    );
  }

  static userAlreadyExists(email?: string): AppError {
    return new AppError(
      email ? `User with email ${email} already exists` : 'User already exists',
      ErrorCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      true,
      { email },
    );
  }

  // Room errors
  static roomNotFound(roomId?: string): AppError {
    return new AppError(
      roomId ? `Room with ID ${roomId} not found` : 'Room not found',
      ErrorCode.ROOM_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      true,
      { roomId },
    );
  }

  static roomAccessDenied(roomId?: string): AppError {
    return new AppError(
      'Access denied to this room',
      ErrorCode.ROOM_ACCESS_DENIED,
      HttpStatus.FORBIDDEN,
      true,
      { roomId },
    );
  }

  static alreadyRoomMember(roomId?: string): AppError {
    return new AppError(
      'User is already a member of this room',
      ErrorCode.ROOM_ALREADY_MEMBER,
      HttpStatus.CONFLICT,
      true,
      { roomId },
    );
  }

  // Invitation errors
  static invitationNotFound(invitationId?: string): AppError {
    return new AppError(
      'Invitation not found or no longer available',
      ErrorCode.INVITATION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      true,
      { invitationId },
    );
  }

  static invitationExpired(invitationId?: string): AppError {
    return new AppError(
      'Invitation has expired',
      ErrorCode.INVITATION_EXPIRED,
      HttpStatus.BAD_REQUEST,
      true,
      { invitationId },
    );
  }

  static invitationNotForUser(invitationId?: string): AppError {
    return new AppError(
      'This invitation is not intended for you',
      ErrorCode.INVITATION_NOT_FOR_USER,
      HttpStatus.FORBIDDEN,
      true,
      { invitationId },
    );
  }

  static invitationAlreadyUsed(invitationId?: string): AppError {
    return new AppError(
      'This invitation has already been responded to',
      ErrorCode.INVITATION_ALREADY_USED,
      HttpStatus.BAD_REQUEST,
      true,
      { invitationId },
    );
  }

  // AI errors
  static aiProviderError(provider: string, details?: any): AppError {
    return new AppError(
      `AI provider ${provider} encountered an error`,
      ErrorCode.AI_PROVIDER_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
      true,
      { provider, ...details },
    );
  }

  static aiGenerationFailed(details?: any): AppError {
    return new AppError(
      'Failed to generate AI response',
      ErrorCode.AI_GENERATION_FAILED,
      HttpStatus.INTERNAL_SERVER_ERROR,
      true,
      details,
    );
  }

  // Attachment errors
  static attachmentNotFound(attachmentId?: string): AppError {
    return new AppError(
      'Attachment not found',
      ErrorCode.ATTACHMENT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      true,
      { attachmentId },
    );
  }

  static attachmentUploadFailed(details?: any): AppError {
    return new AppError(
      'Failed to upload attachment',
      ErrorCode.ATTACHMENT_UPLOAD_FAILED,
      HttpStatus.BAD_REQUEST,
      true,
      details,
    );
  }

  // Validation errors
  static validationError(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      true,
      details,
    );
  }

  // Generic errors
  static internalServerError(message?: string, details?: any): AppError {
    return new AppError(
      message || 'Internal server error',
      ErrorCode.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      details,
    );
  }
}
