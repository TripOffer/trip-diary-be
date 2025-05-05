import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { GetDiaryCommentsQueryDto } from './dto/get-diary-comments-query.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(
    diaryId: string,
    input: CreateCommentInput,
    userId: number,
  ) {
    // 检查日记是否存在
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) throw new NotFoundException('日记不存在');
    // 如果有 parentId，校验 parent 评论是否属于同一日记
    const parentComment = input.parentId
      ? await this.prisma.comment.findUnique({ where: { id: input.parentId } })
      : null;
    if (input.parentId) {
      if (!parentComment) throw new NotFoundException('父评论不存在');
      if (parentComment.diaryId !== diaryId)
        throw new ForbiddenException('父评论不属于该日记');
    }
    // 创建评论并维护计数
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content: input.content,
          diaryId,
          authorId: userId,
          parentId: input.parentId,
        },
      });
      await tx.diary.update({
        where: { id: diaryId },
        data: { commentCount: { increment: 1 } },
      });
      if (input.parentId) {
        await tx.comment.update({
          where: { id: input.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }
      return comment;
    });
  }

  async deleteComment(commentId: string, user: { id: number; role?: string }) {
    // 查询评论，包含 diaryId 和 parentId
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('评论不存在');
    // 允许作者本人或审核员/管理员删除
    const canReview =
      user.role === 'Admin' ||
      user.role === 'Super' ||
      user.role === 'Reviewer';
    if (comment.authorId !== user.id && !canReview) {
      throw new ForbiddenException('无权删除');
    }
    // 删除评论并维护计数
    return this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id: commentId } });
      await tx.diary.update({
        where: { id: comment.diaryId },
        data: { commentCount: { decrement: 1 } },
      });
      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: { replyCount: { decrement: 1 } },
        });
      }
      return { success: true };
    });
  }

  async getDiaryComments(
    diaryId: string,
    query: GetDiaryCommentsQueryDto,
    userId?: number,
  ) {
    const { page = 1, size = 10 } = query;
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { diaryId, parentId: null },
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * size,
        take: size,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { diaryId, parentId: null } }),
    ]);
    let isLikedMap: Record<string, boolean> = {};
    if (userId) {
      const commentIds = comments.map((c) => c.id);
      const liked = await this.prisma.commentLike.findMany({
        where: { userId, commentId: { in: commentIds } },
        select: { commentId: true },
      });
      isLikedMap = Object.fromEntries(liked.map((l) => [l.commentId, true]));
    }
    const list = comments.map((c) => ({
      ...c,
      ...(userId !== undefined ? { isLiked: !!isLikedMap[c.id] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
  }

  async getCommentReplies(
    commentId: string,
    query: GetDiaryCommentsQueryDto,
    userId?: number,
  ) {
    // 校验评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('评论不存在');
    const { page = 1, size = 10 } = query;
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * size,
        take: size,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { parentId: commentId } }),
    ]);
    let isLikedMap: Record<string, boolean> = {};
    if (userId) {
      const commentIds = comments.map((c) => c.id);
      const liked = await this.prisma.commentLike.findMany({
        where: { userId, commentId: { in: commentIds } },
        select: { commentId: true },
      });
      isLikedMap = Object.fromEntries(liked.map((l) => [l.commentId, true]));
    }
    const list = comments.map((c) => ({
      ...c,
      ...(userId !== undefined ? { isLiked: !!isLikedMap[c.id] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
  }

  async likeComment(commentId: string, userId: number) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('评论不存在');
    // 检查是否已点赞
    const existed = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (existed) return { message: '已点赞' };
    // 点赞并自增 likeCount
    await this.prisma.$transaction([
      this.prisma.commentLike.create({ data: { userId, commentId } }),
      this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    return { message: '点赞成功' };
  }

  async unlikeComment(commentId: string, userId: number) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('评论不存在');
    // 检查是否已点赞
    const existed = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (!existed) return { message: '未点赞' };
    // 取消点赞并自减 likeCount
    await this.prisma.$transaction([
      this.prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      }),
      this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    return { message: '已取消点赞' };
  }
}
