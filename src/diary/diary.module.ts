import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagService } from 'src/tag/tag.service';
import { CommentModule } from './comment/comment.module';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { FavoriteModule } from './favorite/favorite.module';
import { LikeModule } from './like/like.module';
import { SearchModule } from './search/search.module';
import { TrackService } from 'src/common/track.service';

@Module({
  imports: [
    PrismaModule,
    CommentModule,
    LikeModule,
    FavoriteModule,
    SearchModule,
  ],
  providers: [DiaryService, TagService, TrackService],
  controllers: [DiaryController],
  exports: [DiaryService],
})
export class DiaryModule {}
