import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackStatsService } from 'src/track/track-stats.service';

@Module({
  providers: [FavoriteService, PrismaService, TrackStatsService],
  controllers: [FavoriteController],
})
export class FavoriteModule {}
