import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
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

    response.status(status).json({
      code,
      msg,
      data,
    });
  }
}
