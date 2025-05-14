import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code = -1;
    let msg = 'failed';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let data = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        msg = res;
      } else if (typeof res === 'object' && res !== null) {
        if ((res as any).message) {
          // DTO校验错误时 message 可能是数组
          const message = (res as any).message;
          msg = Array.isArray(message) ? message.join('; ') : message;
        } else if ((res as any).error) {
          msg = (res as any).error;
        }
      }
      code = status;
    } else if (exception instanceof Error) {
      msg = exception.message;
    }

    if (status >= 500) {
      // 记录系统级别错误日志
      this.logger.error(
        `[${request.method}] ${request.url} - ${msg}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${msg}`);
    }

    response.status(status).json({
      code,
      msg,
      data,
    });
  }
}
