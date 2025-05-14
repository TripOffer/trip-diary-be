import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import * as morgan from 'morgan';
import { accessLogStream } from './common/log.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 允许所有跨域
  // 系统级别请求日志采集
  app.use(morgan('combined', { stream: accessLogStream }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
