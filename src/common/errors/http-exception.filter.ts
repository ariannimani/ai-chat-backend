import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from './app-error.class';
import { ErrorCode } from './error-codes.enum';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let errorCode: ErrorCode;
    let details: any = null;

    if (exception instanceof AppError) {
      // Handle our custom AppError
      status = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      // Handle NestJS HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exception.message;
        details = exceptionResponse;
      } else {
        message = exception.message;
      }

      errorCode = this.mapHttpStatusToErrorCode(status);
    } else if (exception instanceof Error) {
      // Handle generic Error - check if it's a Supabase error
      const errorMessage = exception.message || 'Internal server error';

      // Check if this is a Supabase authentication error
      if (this.isSupabaseAuthError(errorMessage)) {
        status = HttpStatus.UNAUTHORIZED;
        message = errorMessage;
        errorCode = ErrorCode.AUTH_INVALID_CREDENTIALS;
      }
      // Check if this is a Supabase validation error
      else if (this.isSupabaseValidationError(errorMessage)) {
        status = HttpStatus.BAD_REQUEST;
        message = errorMessage;
        errorCode = ErrorCode.VALIDATION_ERROR;
      }
      // Check if this is a Supabase rate limit error
      else if (this.isSupabaseRateLimitError(errorMessage)) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        message = errorMessage;
        errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
      }
      // Default to internal server error for other errors
      else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = errorMessage;
        errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      }

      // Log unexpected errors
      this.logger.error(`Unexpected error: ${errorMessage}`, exception.stack);
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

      this.logger.error('Unknown exception type', exception);
    }

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        ...(details && { details }),
      },
    };

    // Log error for monitoring (but not validation errors in production)
    if (status >= 500 || process.env.NODE_ENV !== 'production') {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(errorResponse);
  }

  private mapHttpStatusToErrorCode(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_INVALID_CREDENTIALS;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.USER_NOT_FOUND; // Generic, will be overridden by specific errors
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
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
