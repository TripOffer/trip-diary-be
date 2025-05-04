import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [LikeService, PrismaService],
  controllers: [LikeController],
})
export class LikeModule {}
