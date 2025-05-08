import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackStatsService } from 'src/track/track-stats.service';

@Module({
  providers: [CommentService, PrismaService, TrackStatsService],
  controllers: [CommentController],
})
export class CommentModule {}
