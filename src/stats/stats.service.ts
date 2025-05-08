import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    // 用户统计
    const userTotal = await this.prisma.user.count();
    const userToday = await this.prisma.user.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    // 近7天活跃用户（有登录、发帖、评论、浏览行为）
    const activeUserSet = new Set<number>();
    const diaryAuthors = await this.prisma.user.findMany({
      where: { diaries: { some: { createdAt: { gte: last7Days } } } },
      select: { id: true },
    });
    diaryAuthors.forEach((u) => activeUserSet.add(u.id));
    const commentAuthors = await this.prisma.user.findMany({
      where: { comments: { some: { createdAt: { gte: last7Days } } } },
      select: { id: true },
    });
    commentAuthors.forEach((u) => activeUserSet.add(u.id));
    const viewUsers = await this.prisma.viewHistory.findMany({
      where: { viewedAt: { gte: last7Days } },
      select: { userId: true },
    });
    viewUsers.forEach((v) => activeUserSet.add(v.userId));
    const activeUserCount = activeUserSet.size;

    // 日记统计
    const diaryTotal = await this.prisma.diary.count();
    const diaryToday = await this.prisma.diary.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    const diaryPending = await this.prisma.diary.count({
      where: { status: 'Pending' },
    });
    const diaryApproved = await this.prisma.diary.count({
      where: { status: 'Approved' },
    });
    const diaryRejected = await this.prisma.diary.count({
      where: { status: 'Rejected' },
    });
    const diaryViewTotal = await this.prisma.diary.aggregate({
      _sum: { viewCount: true },
    });
    const diaryLikeTotal = await this.prisma.diary.aggregate({
      _sum: { likeCount: true },
    });
    const diaryFavoriteTotal = await this.prisma.diary.aggregate({
      _sum: { favoriteCount: true },
    });
    const diaryShareTotal = await this.prisma.diary.aggregate({
      _sum: { shareCount: true },
    });

    // 评论统计
    const commentTotal = await this.prisma.comment.count();
    const commentToday = await this.prisma.comment.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    const commentLikeTotal = await this.prisma.comment.aggregate({
      _sum: { likeCount: true },
    });
    const commentReplyTotal = await this.prisma.comment.aggregate({
      _sum: { replyCount: true },
    });

    // 标签统计
    const tagTotal = await this.prisma.tag.count();
    const tagViewTotal = await this.prisma.tag.aggregate({
      _sum: { viewCount: true },
    });

    return {
      user: {
        total: userTotal,
        today: userToday,
        active7d: activeUserCount,
      },
      diary: {
        total: diaryTotal,
        today: diaryToday,
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
        viewTotal: diaryViewTotal._sum.viewCount || 0,
        likeTotal: diaryLikeTotal._sum.likeCount || 0,
        favoriteTotal: diaryFavoriteTotal._sum.favoriteCount || 0,
        shareTotal: diaryShareTotal._sum.shareCount || 0,
      },
      comment: {
        total: commentTotal,
        today: commentToday,
        likeTotal: commentLikeTotal._sum.likeCount || 0,
        replyTotal: commentReplyTotal._sum.replyCount || 0,
      },
      tag: {
        total: tagTotal,
        viewTotal: tagViewTotal._sum.viewCount || 0,
      },
      audit: {
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
      },
    };
  }

  async getReviewerStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 日记统计
    const diaryTotal = await this.prisma.diary.count();
    const diaryToday = await this.prisma.diary.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    const diaryPending = await this.prisma.diary.count({
      where: { status: 'Pending' },
    });
    const diaryApproved = await this.prisma.diary.count({
      where: { status: 'Approved' },
    });
    const diaryRejected = await this.prisma.diary.count({
      where: { status: 'Rejected' },
    });
    const diaryViewTotal = await this.prisma.diary.aggregate({
      _sum: { viewCount: true },
    });
    const diaryLikeTotal = await this.prisma.diary.aggregate({
      _sum: { likeCount: true },
    });
    const diaryFavoriteTotal = await this.prisma.diary.aggregate({
      _sum: { favoriteCount: true },
    });
    const diaryShareTotal = await this.prisma.diary.aggregate({
      _sum: { shareCount: true },
    });

    // 评论统计
    const commentTotal = await this.prisma.comment.count();
    const commentToday = await this.prisma.comment.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    const commentLikeTotal = await this.prisma.comment.aggregate({
      _sum: { likeCount: true },
    });
    const commentReplyTotal = await this.prisma.comment.aggregate({
      _sum: { replyCount: true },
    });

    // 标签统计
    const tagTotal = await this.prisma.tag.count();
    const tagViewTotal = await this.prisma.tag.aggregate({
      _sum: { viewCount: true },
    });

    return {
      diary: {
        total: diaryTotal,
        today: diaryToday,
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
        viewTotal: diaryViewTotal._sum.viewCount || 0,
        likeTotal: diaryLikeTotal._sum.likeCount || 0,
        favoriteTotal: diaryFavoriteTotal._sum.favoriteCount || 0,
        shareTotal: diaryShareTotal._sum.shareCount || 0,
      },
      comment: {
        total: commentTotal,
        today: commentToday,
        likeTotal: commentLikeTotal._sum.likeCount || 0,
        replyTotal: commentReplyTotal._sum.replyCount || 0,
      },
      tag: {
        total: tagTotal,
        viewTotal: tagViewTotal._sum.viewCount || 0,
      },
      audit: {
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
      },
    };
  }
}
