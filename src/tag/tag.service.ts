import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { diarySelect } from '../diary/common/diary.select';
import { TrackStatsService } from 'src/track/track-stats.service';

@Injectable()
export class TagService {
  constructor(
    private prisma: PrismaService,
    private trackStatsService: TrackStatsService,
  ) {}

  /**
   * 根据标签名数组查找已存在的标签，并为不存在的标签创建新标签，返回所有标签的id对象数组
   */
  async findOrCreateTagsByName(names: string[]): Promise<{ id: string }[]> {
    if (!names || names.length === 0) return [];
    // 查询已存在的标签
    const existedTags = await this.prisma.tag.findMany({
      where: { name: { in: names } },
    });
    const existedTagNames = existedTags.map((t) => t.name);
    const existedTagIds = existedTags.map((t) => ({ id: t.id }));
    // 新建不存在的标签
    const newTagNames = names.filter((name) => !existedTagNames.includes(name));
    const newTags = await Promise.all(
      newTagNames.map((name) => this.prisma.tag.create({ data: { name } })),
    );
    const newTagIds = newTags.map((t) => ({ id: t.id }));
    // 埋点：标签创建
    await this.trackStatsService.incr('tag_create', new Date(), names.length);
    return [...existedTagIds, ...newTagIds];
  }

  /**
   * 获取热门标签列表
   */
  async getHotTags(query: {
    page?: number;
    size?: number;
    sort?: 'viewCount' | 'diaryCount';
  }) {
    const { page = 1, size = 20, sort = 'viewCount' } = query;
    const skip = (page - 1) * size;
    let orderBy;
    if (sort === 'viewCount') {
      orderBy = { viewCount: 'desc' };
    } else {
      orderBy = { diaries: { _count: 'desc' } };
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          viewCount: true,
          _count: { select: { diaries: true } },
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.tag.count(),
    ]);
    const totalPage = Math.ceil(total / size);
    return {
      list: list.map((tag) => ({
        id: tag.id,
        name: tag.name,
        viewCount: tag.viewCount,
        diaryCount: tag._count.diaries,
      })),
      total,
      page,
      size,
      totalPage,
    };
  }

  /**
   * 获取某个标签下的日记列表
   */
  async getTagDiaries(tagId: string, query: { page?: number; size?: number }) {
    const { page = 1, size = 10 } = query;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.diary.findMany({
        where: {
          published: true,
          status: 'Approved',
          tags: { some: { id: tagId } },
        },
        orderBy: { publishedAt: 'desc' },
        select: diarySelect,
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.diary.count({
        where: {
          published: true,
          status: 'Approved',
          tags: { some: { id: tagId } },
        },
      }),
    ]);
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
  }

  async getTagById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        viewCount: true,
        _count: { select: { diaries: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!tag) return null;
    // 埋点：标签浏览
    await this.trackStatsService.incr('tag_view', new Date(), 1);
    return {
      id: tag.id,
      name: tag.name,
      viewCount: tag.viewCount,
      diaryCount: tag._count.diaries,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async getTagByName(name: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        viewCount: true,
        _count: { select: { diaries: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!tag) return null;
    return {
      id: tag.id,
      name: tag.name,
      viewCount: tag.viewCount,
      diaryCount: tag._count.diaries,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
