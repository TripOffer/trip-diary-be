import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchDiaryDto } from './dto/search.dto';
import { diarySelect } from '../common/diary.select';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchDiaries(dto: SearchDiaryDto, userId?: number) {
    const {
      query,
      sort = 'publishedAt',
      order = 'desc',
      page = 1,
      size = 10,
    } = dto;
    let where: any = {
      published: true,
      status: 'Approved',
    };
    if (query) {
      if (query.startsWith('@')) {
        // 按作者名字模糊搜索
        const authorName = query.slice(1);
        // 查找所有匹配的用户id
        const users = await this.prisma.user.findMany({
          where: { name: { contains: authorName, mode: 'insensitive' } },
          select: { id: true },
        });
        const authorIds = users.map((u) => u.id);
        if (authorIds.length === 0) {
          // 没有匹配作者，直接返回空
          return { list: [], total: 0, page, size, totalPage: 0 };
        }
        where.authorId = { in: authorIds };
      } else if (query.startsWith('#')) {
        // 按标签名模糊搜索
        const tagName = query.slice(1);
        const tags = await this.prisma.tag.findMany({
          where: { name: { contains: tagName, mode: 'insensitive' } },
          select: { id: true },
        });
        const tagIds = tags.map((t) => t.id);
        if (tagIds.length === 0) {
          // 没有匹配标签，直接返回空
          return { list: [], total: 0, page, size, totalPage: 0 };
        }
        where.tags = { some: { id: { in: tagIds } } };
      } else {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ];
      }
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.diary.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * size,
        take: size,
        select: diarySelect,
      }),
      this.prisma.diary.count({ where }),
    ]);
    let likedIds: string[] = [];
    let favoritedIds: string[] = [];
    let followedAuthorIds: number[] = [];
    if (userId && list.length > 0) {
      const diaryIds = list.map((d) => d.id);
      const authorIds = list.map((d) => d.authorId);
      const [likes, favorites, follows] = await this.prisma.$transaction([
        this.prisma.like.findMany({
          where: { userId, diaryId: { in: diaryIds } },
          select: { diaryId: true },
        }),
        this.prisma.favorite.findMany({
          where: { userId, diaryId: { in: diaryIds } },
          select: { diaryId: true },
        }),
        this.prisma.userFollow.findMany({
          where: { followerId: userId, followingId: { in: authorIds } },
          select: { followingId: true },
        }),
      ]);
      likedIds = likes.map((l) => l.diaryId);
      favoritedIds = favorites.map((f) => f.diaryId);
      followedAuthorIds = follows.map((f) => f.followingId);
    }
    const resultList = list.map((d) => ({
      ...d,
      ...(userId
        ? {
            isLiked: likedIds.includes(d.id),
            isFavorited: favoritedIds.includes(d.id),
            isFollowedAuthor: followedAuthorIds.includes(d.authorId),
          }
        : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list: resultList, total, page, size, totalPage };
  }
}
