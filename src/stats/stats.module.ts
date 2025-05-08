import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';
import { TrackStatsService } from '../track/track-stats.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService, PrismaService, TrackStatsService],
})
export class StatsModule {}
