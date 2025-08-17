import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppError } from './app-error.class';
import { ErrorCode } from './error-codes.enum';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let message: string;
    let errorCode: ErrorCode;
    let details: any = null;

    if (exception instanceof AppError) {
      // Handle our custom AppError
      message = exception.message;
      errorCode = exception.errorCode;
      details = exception.details;
    } else if (exception instanceof WsException) {
      // Handle NestJS WsException
      const exceptionData = exception.getError();

      if (typeof exceptionData === 'string') {
        message = exceptionData;
        errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      } else if (typeof exceptionData === 'object' && exceptionData !== null) {
        message = (exceptionData as any).message || 'WebSocket error';
        errorCode =
          (exceptionData as any).errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
        details = exceptionData;
      } else {
        message = 'WebSocket error';
        errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Error) {
      // Handle generic Error - check if it's a Supabase error
      const errorMessage = exception.message || 'Internal server error';

      // Check if this is a Supabase authentication error
      if (this.isSupabaseAuthError(errorMessage)) {
        message = errorMessage;
        errorCode = ErrorCode.AUTH_INVALID_CREDENTIALS;
      }
      // Check if this is a Supabase validation error
      else if (this.isSupabaseValidationError(errorMessage)) {
        message = errorMessage;
        errorCode = ErrorCode.VALIDATION_ERROR;
      }
      // Check if this is a Supabase rate limit error
      else if (this.isSupabaseRateLimitError(errorMessage)) {
        message = errorMessage;
        errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
      }
      // Default to internal server error for other errors
      else {
        message = errorMessage;
        errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      }

      // Log unexpected errors
      this.logger.error(
        `Unexpected WebSocket error: ${errorMessage}`,
        exception.stack,
      );
    } else {
      // Handle unknown exceptions
      message = 'An unexpected error occurred';
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

      this.logger.error('Unknown WebSocket exception type', exception);
    }

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
        ...(details && { details }),
      },
    };

    // Log error for monitoring
    this.logger.error(
      `WebSocket error for client ${client.id}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Emit error to client
    client.emit('error', errorResponse);
  }

  private isSupabaseAuthError(message: string): boolean {
    const authErrorPatterns = [
      'Invalid login credentials',
      'Email not confirmed',
      'User not found',
      'Invalid email or password',
      'Email not confirmed',
      'Invalid JWT',
      'JWT expired',
      'Invalid refresh token',
      'User already registered',
      'Password should be at least',
      'Unable to validate email address',
    ];
    return authErrorPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  private isSupabaseValidationError(message: string): boolean {
    const validationErrorPatterns = [
      'Invalid email format',
      'Password should be at least',
      'User already registered',
      'Invalid phone number',
      'Invalid metadata',
    ];
    return validationErrorPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  private isSupabaseRateLimitError(message: string): boolean {
    const rateLimitPatterns = [
      'rate limit',
      'too many requests',
      'For security purposes, you can only request this after',
      'rate limit exceeded',
    ];
    return rateLimitPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }
}
