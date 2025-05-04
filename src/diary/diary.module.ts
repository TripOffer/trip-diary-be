import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { FavoriteModule } from './favorite/favorite.module';

@Module({
  imports: [CommentModule, LikeModule, FavoriteModule],
  providers: [DiaryService, PrismaService],
  controllers: [DiaryController],
})
export class DiaryModule {}
