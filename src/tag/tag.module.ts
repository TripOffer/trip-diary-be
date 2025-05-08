import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackStatsService } from 'src/track/track-stats.service';

@Module({
  imports: [PrismaModule],
  providers: [TagService, TrackStatsService],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}
