import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackStatsService } from '../track/track-stats.service';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    private trackStats: TrackStatsService,
  ) {}

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
    const userTodayRows = await this.trackStats.getRange(
      'user_register',
      today,
      today,
    );
    const userToday = userTodayRows.length > 0 ? userTodayRows[0].value : 0;
    const active7dRows = await this.trackStats.getRange(
      'user_active',
      last7Days,
      today,
    );
    const activeUserCount = active7dRows.reduce(
      (sum, row) => sum + row.value,
      0,
    );

    // 日记统计（只统计没有children的日记）
    const diaryWhere = { children: { none: {} } };
    const diaryTotal = await this.prisma.diary.count({ where: diaryWhere });
    const diaryTodayRows = await this.trackStats.getRange(
      'diary_create',
      today,
      today,
    );
    const diaryToday = diaryTodayRows.length > 0 ? diaryTodayRows[0].value : 0;
    const diaryPending = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Pending' },
    });
    const diaryApproved = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Approved' },
    });
    const diaryRejected = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Rejected' },
    });
    const diaryViewTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { viewCount: true },
          where: diaryWhere,
        })
      )._sum.viewCount || 0;
    const diaryLikeTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { likeCount: true },
          where: diaryWhere,
        })
      )._sum.likeCount || 0;
    const diaryFavoriteTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { favoriteCount: true },
          where: diaryWhere,
        })
      )._sum.favoriteCount || 0;
    const diaryShareTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { shareCount: true },
          where: diaryWhere,
        })
      )._sum.shareCount || 0;

    // 评论统计
    const commentTotal = await this.prisma.comment.count();
    const commentTodayRows = await this.trackStats.getRange(
      'comment_create',
      today,
      today,
    );
    const commentToday =
      commentTodayRows.length > 0 ? commentTodayRows[0].value : 0;
    const commentLikeTotal =
      (await this.prisma.comment.aggregate({ _sum: { likeCount: true } }))._sum
        .likeCount || 0;
    const commentReplyTotal =
      (await this.prisma.comment.aggregate({ _sum: { replyCount: true } }))._sum
        .replyCount || 0;

    // 标签统计
    const tagTotal = await this.prisma.tag.count();
    const tagCreateRows = await this.trackStats.getRange(
      'tag_create',
      today,
      today,
    );
    const tagCreateToday =
      tagCreateRows.length > 0 ? tagCreateRows[0].value : 0;
    const tagViewTotal =
      (await this.prisma.tag.aggregate({ _sum: { viewCount: true } }))._sum
        .viewCount || 0;

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
        viewTotal: diaryViewTotal,
        likeTotal: diaryLikeTotal,
        favoriteTotal: diaryFavoriteTotal,
        shareTotal: diaryShareTotal,
      },
      comment: {
        total: commentTotal,
        today: commentToday,
        likeTotal: commentLikeTotal,
        replyTotal: commentReplyTotal,
      },
      tag: {
        total: tagTotal,
        createToday: tagCreateToday,
        viewTotal: tagViewTotal,
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

    // 日记统计（只统计没有children的日记）
    const diaryWhere = { children: { none: {} } };
    const diaryTotal = await this.prisma.diary.count({ where: diaryWhere });
    const diaryTodayRows = await this.trackStats.getRange(
      'diary_create',
      today,
      today,
    );
    const diaryToday = diaryTodayRows.length > 0 ? diaryTodayRows[0].value : 0;
    const diaryPending = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Pending' },
    });
    const diaryApproved = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Approved' },
    });
    const diaryRejected = await this.prisma.diary.count({
      where: { ...diaryWhere, status: 'Rejected' },
    });
    const diaryViewTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { viewCount: true },
          where: diaryWhere,
        })
      )._sum.viewCount || 0;
    const diaryLikeTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { likeCount: true },
          where: diaryWhere,
        })
      )._sum.likeCount || 0;
    const diaryFavoriteTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { favoriteCount: true },
          where: diaryWhere,
        })
      )._sum.favoriteCount || 0;
    const diaryShareTotal =
      (
        await this.prisma.diary.aggregate({
          _sum: { shareCount: true },
          where: diaryWhere,
        })
      )._sum.shareCount || 0;

    // 评论统计
    const commentTotal = await this.prisma.comment.count();
    const commentTodayRows = await this.trackStats.getRange(
      'comment_create',
      today,
      today,
    );
    const commentToday =
      commentTodayRows.length > 0 ? commentTodayRows[0].value : 0;
    const commentLikeTotal =
      (await this.prisma.comment.aggregate({ _sum: { likeCount: true } }))._sum
        .likeCount || 0;
    const commentReplyTotal =
      (await this.prisma.comment.aggregate({ _sum: { replyCount: true } }))._sum
        .replyCount || 0;

    // 标签统计
    const tagTotal = await this.prisma.tag.count();
    const tagCreateRows = await this.trackStats.getRange(
      'tag_create',
      today,
      today,
    );
    const tagCreateToday =
      tagCreateRows.length > 0 ? tagCreateRows[0].value : 0;
    const tagViewTotal =
      (await this.prisma.tag.aggregate({ _sum: { viewCount: true } }))._sum
        .viewCount || 0;

    return {
      diary: {
        total: diaryTotal,
        today: diaryToday,
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
        viewTotal: diaryViewTotal,
        likeTotal: diaryLikeTotal,
        favoriteTotal: diaryFavoriteTotal,
        shareTotal: diaryShareTotal,
      },
      comment: {
        total: commentTotal,
        today: commentToday,
        likeTotal: commentLikeTotal,
        replyTotal: commentReplyTotal,
      },
      tag: {
        total: tagTotal,
        createToday: tagCreateToday,
        viewTotal: tagViewTotal,
      },
      audit: {
        pending: diaryPending,
        approved: diaryApproved,
        rejected: diaryRejected,
      },
    };
  }
}
