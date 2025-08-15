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
      // Handle generic Error
      message = exception.message || 'Internal server error';
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

      // Log unexpected errors
      this.logger.error(
        `Unexpected WebSocket error: ${exception.message}`,
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
}
