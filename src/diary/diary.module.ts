import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagService } from 'src/tag/tag.service';
import { CommentModule } from './comment/comment.module';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { FavoriteModule } from './favorite/favorite.module';
import { LikeModule } from './like/like.module';
import { SearchModule } from './search/search.module';
import { TrackService } from 'src/track/track.service';
import { TrackStatsService } from 'src/track/track-stats.service';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [
    PrismaModule,
    CommentModule,
    LikeModule,
    FavoriteModule,
    SearchModule,
    OssModule,
  ],
  providers: [DiaryService, TagService, TrackService, TrackStatsService],
  controllers: [DiaryController],
  exports: [DiaryService],
})
export class DiaryModule {}
