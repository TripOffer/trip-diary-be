import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackStatsService } from 'src/track/track-stats.service';

@Module({
  providers: [LikeService, PrismaService, TrackStatsService],
  controllers: [LikeController],
})
export class LikeModule {}
