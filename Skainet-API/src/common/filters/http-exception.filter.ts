import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('SystemError');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal Server Error' };

    const errorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'object' ? (message as any).message || JSON.stringify(message) : message,
      stack: exception instanceof Error ? exception.stack : null,
    };

    // Log the error for Render monitoring / system admin
    this.logger.error(
      `[Error de Sistema] ${request.method} ${request.url} | Status: ${status} | Error: ${JSON.stringify(errorDetails.message)}`,
      errorDetails.stack,
    );

    response.status(status).json(errorDetails);
  }
}
