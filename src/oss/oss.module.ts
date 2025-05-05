import { Module } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';
import { RedisService } from '../common/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [OssService, RedisService, PrismaService],
  controllers: [OssController],
  exports: [OssService],
})
export class OssModule {}
