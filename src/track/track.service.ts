import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {}

  /**
   * 日记浏览埋点：viewCount +1，写入 ViewHistory（每天只保留一条最新记录）
   */
  async trackDiaryView(diaryId: string, userId?: number, authorId?: number) {
    // viewCount 无论是否作者本人都自增
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { viewCount: { increment: 1 } },
    });
    // Tag viewCount 埋点：所有关联标签+1
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
      select: { tags: { select: { id: true } } },
    });
    if (diary && diary.tags.length > 0) {
      await this.prisma.tag.updateMany({
        where: { id: { in: diary.tags.map((t) => t.id) } },
        data: { viewCount: { increment: 1 } },
      });
    }
    // ViewHistory 仅已登录用户，且每天只保留一条最新记录
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const exist = await this.prisma.viewHistory.findFirst({
        where: {
          userId,
          diaryId,
          viewedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
      if (exist) {
        await this.prisma.viewHistory.update({
          where: { id: exist.id },
          data: { viewedAt: new Date() },
        });
      } else {
        await this.prisma.viewHistory.create({
          data: { userId, diaryId },
        });
      }
    }
  }

  /**
   * 日记点赞埋点
   */
  async trackDiaryLike(diaryId: string, increment = 1) {
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { likeCount: { increment } },
    });
  }

  /**
   * 日记收藏埋点
   */
  async trackDiaryFavorite(diaryId: string, increment = 1) {
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { favoriteCount: { increment } },
    });
  }

  /**
   * 日记评论埋点
   */
  async trackDiaryComment(diaryId: string, increment = 1) {
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { commentCount: { increment } },
    });
  }

  /**
   * 日记分享埋点
   */
  async trackDiaryShare(diaryId: string, increment = 1) {
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { shareCount: { increment } },
    });
  }

  /**
   * 评论点赞埋点
   */
  async trackCommentLike(commentId: string, increment = 1) {
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment } },
    });
  }

  // 可继续扩展更多埋点方法
}
