import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { pinyin } from 'pinyin-pro';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  diaryDetailSelect,
  diarySelect,
  diarySelfSelect,
} from './common/diary.select';
import { CreateDiaryInput } from './dto/create-diary.input';
import { GetUserDiariesQueryDto } from './dto/get-user-diaries-query.dto';
import { DiaryReviewStatus, ReviewDiaryInput } from './dto/review-diary.input';
import { UpdateDiaryInput } from './dto/update-diary.input';
import { TagService } from '../tag/tag.service';
import { generateSlug } from '../common/slug.util';
import { ReviewDiaryQueryDto } from './dto/review-diary-query.dto';
import { TrackService } from '../track/track.service';
import { TrackStatsService } from '../track/track-stats.service';
import { OssService } from '../oss/oss.service';

@Injectable()
export class DiaryService {
  constructor(
    private prisma: PrismaService,
    private tagService: TagService,
    private trackService: TrackService, // 新增注入
    private trackStatsService: TrackStatsService,
    private ossService: OssService, // 新增注入
  ) {}

  async create(createDiaryInput: CreateDiaryInput, authorId: number) {
    const { title, content, tags, images, video, thumbnail, published } =
      createDiaryInput;
    const slug = generateSlug(title);
    let tagsConnect: { id: string }[] | undefined = undefined;
    if (tags && tags.length > 0) {
      tagsConnect = await this.tagService.findOrCreateTagsByName(tags);
    }
    const result = await this.prisma.diary.create({
      data: {
        title,
        content,
        slug,
        authorId,
        images: images || [],
        video,
        thumbnail,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
        tags: tagsConnect ? { connect: tagsConnect } : undefined,
      },
      select: { id: true },
    });
    if (!result) {
      throw new NotFoundException('日记创建失败');
    }
    // 埋点：新增日记
    await this.trackStatsService.incr('diary_create', new Date(), 1);
    return { message: '日记创建成功', id: result.id };
  }

  async updateDiary(id: string, input: UpdateDiaryInput, user: any) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('日记不存在');
    if (user.role !== 'Admin' && user.id !== diary.authorId) {
      throw new BadRequestException('无权限操作');
    }
    const { tags, title, published, ...rest } = input;
    let tagsConnect: { id: string }[] | undefined = undefined;
    if (tags) {
      tagsConnect = await this.tagService.findOrCreateTagsByName(tags);
    }
    if (diary.parentId) {
      // 如果本身就是副本，直接修改副本内容
      const updateData: any = {
        ...rest,
        ...(title ? { title } : {}),
        tags: tagsConnect ? { set: tagsConnect } : undefined,
        status: 'Pending',
      };
      if (published !== undefined) {
        updateData.published = published;
        updateData.publishedAt = published ? new Date() : null;
      }
      const updated = await this.prisma.diary.update({
        where: { id },
        data: updateData,
        select: { id: true },
      });
      return { message: '副本已更新，待审核', id: updated.id };
    } else {
      // 主日记，创建副本
      const copySlug = `${diary.slug}-pending-${Date.now()}`;
      const copyData: any = {
        parentId: id,
        authorId: diary.authorId,
        title: title ?? diary.title,
        content: rest.content ?? diary.content,
        slug: copySlug,
        images: rest.images ?? diary.images,
        video: rest.video ?? diary.video,
        thumbnail: rest.thumbnail ?? diary.thumbnail,
        tags: tagsConnect ? { connect: tagsConnect } : undefined,
        status: 'Pending',
      };
      if (published !== undefined) {
        copyData.published = published;
        copyData.publishedAt = published ? new Date() : null;
      }
      const copy = await this.prisma.diary.create({
        data: copyData,
        select: { id: true },
      });
      return { message: '已提交修改，待审核', id: copy.id };
    }
  }

  async deleteDiary(id: string, user: any) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('日记不存在');
    if (
      user.role !== 'Admin' &&
      user.role !== 'Super' &&
      user.id !== diary.authorId
    ) {
      throw new BadRequestException('无权限操作');
    }
    await this.prisma.diary.delete({ where: { id }, select: { id: true } });
    return { message: '删除成功' };
  }

  async getUserDiaries(
    id: number,
    input: GetUserDiariesQueryDto,
    userId?: number,
  ) {
    const { page = 1, size = 10 } = input;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.diary.findMany({
        where: { authorId: id, published: true },
        orderBy: { createdAt: 'desc' },
        select: diarySelect,
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.diary.count({
        where: { authorId: id, published: true, status: 'Approved' },
      }),
    ]);
    let likedIds: string[] = [];
    let thumbnailMetaMap: Record<string, any> = {};
    if (list.length > 0) {
      const thumbnailKeys = list
        .map((d) => d.thumbnail)
        .filter((k): k is string => !!k);
      thumbnailMetaMap =
        await this.ossService.getOssObjectsByKeys(thumbnailKeys);
    }
    if (userId && list.length > 0) {
      const diaryIds = list.map((d) => d.id);
      const likes = await this.prisma.like.findMany({
        where: { userId, diaryId: { in: diaryIds } },
        select: { diaryId: true },
      });
      likedIds = likes.map((l) => l.diaryId);
    }
    const resultList = list.map((d) => ({
      ...d,
      ...(userId ? { isLiked: likedIds.includes(d.id) } : {}),
      ...(d.thumbnail ? { thumbnailMeta: thumbnailMetaMap[d.thumbnail] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list: resultList, total, page, size, totalPage };
  }

  async getAllUserDiaries(
    id: number,
    input: GetUserDiariesQueryDto,
    userId?: number,
  ) {
    const { page = 1, size = 10 } = input;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.diary.findMany({
        where: { authorId: id },
        orderBy: { createdAt: 'desc' },
        select: diarySelfSelect,
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.diary.count({ where: { authorId: id } }),
    ]);
    let likedIds: string[] = [];
    let thumbnailMetaMap: Record<string, any> = {};
    if (list.length > 0) {
      const thumbnailKeys = list
        .map((d) => d.thumbnail)
        .filter((k): k is string => !!k);
      thumbnailMetaMap =
        await this.ossService.getOssObjectsByKeys(thumbnailKeys);
    }
    if (userId && list.length > 0) {
      const diaryIds = list.map((d) => d.id);
      const likes = await this.prisma.like.findMany({
        where: { userId, diaryId: { in: diaryIds } },
        select: { diaryId: true },
      });
      likedIds = likes.map((l) => l.diaryId);
    }
    const resultList = list.map((d) => ({
      ...d,
      ...(userId ? { isLiked: likedIds.includes(d.id) } : {}),
      ...(d.thumbnail ? { thumbnailMeta: thumbnailMetaMap[d.thumbnail] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list: resultList, total, page, size, totalPage };
  }

  async reviewDiary(input: ReviewDiaryInput, reviewerId: number) {
    const { id, status, rejectedReason } = input;
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('日记不存在');
    if (status === DiaryReviewStatus.Rejected && !rejectedReason) {
      throw new BadRequestException('拒绝时必须填写拒绝理由');
    }
    // 如果是副本且审核通过，则同步内容到主日记（slug 不变）
    if (diary.parentId && status === DiaryReviewStatus.Approved) {
      await this.prisma.diary.update({
        where: { id: diary.parentId },
        data: {
          title: diary.title,
          content: diary.content,
          images: diary.images,
          video: diary.video,
          thumbnail: diary.thumbnail,
          tags: {
            set: await this.prisma.tag.findMany({
              where: { diaries: { some: { id: diary.id } } },
              select: { id: true },
            }),
          },
          status: 'Approved',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectedReason: null,
        },
      });
      // 审核通过后删除副本
      await this.prisma.diary.delete({ where: { id } });
      return { message: '审核通过，内容已同步' };
    }
    // 否则只更新副本状态
    await this.prisma.diary.update({
      where: { id },
      data: {
        status,
        rejectedReason:
          status === DiaryReviewStatus.Rejected ? rejectedReason : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      select: { id: true },
    });
    return { message: '操作成功' };
  }

  async updateDiaryPublish(id: string, published: boolean, user: any) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('日记不存在');
    // 只有作者本人或管理员可操作
    if (user.role !== 'Admin' && user.id !== diary.authorId) {
      throw new BadRequestException('无权限操作');
    }
    return this.prisma.diary.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : null,
      },
      select: {
        id: true,
        published: true,
        publishedAt: true,
      },
    });
  }

  async getDiaryDetail(id: string, userId?: number) {
    const diary = await this.prisma.diary.findUnique({
      where: { id },
      select: diaryDetailSelect,
    });
    if (!diary) throw new NotFoundException('日记不存在');

    // 查询封面元信息
    let thumbnailMeta: any = undefined;
    if (diary.thumbnail) {
      thumbnailMeta = await this.ossService.getOssObjectByKey(diary.thumbnail);
    }

    // 埋点：调用 TrackService 统一处理
    await this.trackService.trackDiaryView(id, userId, diary.authorId);
    // 埋点：TrackStats 日记浏览
    await this.trackStatsService.incr('diary_view', new Date(), 1);

    let isLiked: boolean | undefined = undefined;
    let isFavorited: boolean | undefined = undefined;
    let isFollowedAuthor: boolean | undefined = undefined;
    if (userId) {
      const [like, favorite, follow] = await this.prisma.$transaction([
        this.prisma.like.findUnique({
          where: { userId_diaryId: { userId, diaryId: id } },
        }),
        this.prisma.favorite.findUnique({
          where: { userId_diaryId: { userId, diaryId: id } },
        }),
        this.prisma.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: diary.authorId,
            },
          },
        }),
      ]);
      isLiked = !!like;
      isFavorited = !!favorite;
      isFollowedAuthor = !!follow;
    }
    return {
      ...diary,
      ...(userId ? { isLiked, isFavorited, isFollowedAuthor } : {}),
      ...(thumbnailMeta ? { thumbnailMeta } : {}),
    };
  }

  async reviewList(query: ReviewDiaryQueryDto, userId?: number) {
    const {
      status,
      authorId,
      query: q,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      size = 10,
    } = query;
    const where: any = {};
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.diary.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          title: true,
          status: true,
          author: { select: { id: true, name: true } },
          published: true,
          publishedAt: true,
          createdAt: true,
          viewCount: true,
          likeCount: true,
          favoriteCount: true,
          commentCount: true,
          thumbnail: true,
        },
      }),
      this.prisma.diary.count({ where }),
    ]);
    let likedIds: string[] = [];
    let thumbnailMetaMap: Record<string, any> = {};
    if (list.length > 0) {
      const thumbnailKeys = list
        .map((d) => d.thumbnail)
        .filter((k): k is string => !!k);
      thumbnailMetaMap =
        await this.ossService.getOssObjectsByKeys(thumbnailKeys);
    }
    if (userId && list.length > 0) {
      const diaryIds = list.map((d) => d.id);
      const likes = await this.prisma.like.findMany({
        where: { userId, diaryId: { in: diaryIds } },
        select: { diaryId: true },
      });
      likedIds = likes.map((l) => l.diaryId);
    }
    const resultList = list.map((d) => ({
      ...d,
      ...(userId ? { isLiked: likedIds.includes(d.id) } : {}),
      ...(d.thumbnail ? { thumbnailMeta: thumbnailMetaMap[d.thumbnail] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list: resultList, total, page, size, totalPage };
  }

  async recommendDiaries(page = 1, size = 10, userId?: number) {
    // 未登录用户，直接热门推荐
    if (!userId) {
      const [list, total] = await this.prisma.$transaction([
        this.prisma.diary.findMany({
          where: {
            published: true,
            status: 'Approved',
          },
          orderBy: [
            { likeCount: 'desc' },
            { viewCount: 'desc' },
            { publishedAt: 'desc' },
          ],
          select: diarySelect,
          skip: (page - 1) * size,
          take: size,
        }),
        this.prisma.diary.count({
          where: {
            published: true,
            status: 'Approved',
          },
        }),
      ]);
      let thumbnailMetaMap: Record<string, any> = {};
      if (list.length > 0) {
        const thumbnailKeys = list
          .map((d) => d.thumbnail)
          .filter((k): k is string => !!k);
        thumbnailMetaMap =
          await this.ossService.getOssObjectsByKeys(thumbnailKeys);
      }
      const totalPage = Math.ceil(total / size);
      const resultList = list.map((d) => ({
        ...d,
        ...(d.thumbnail
          ? { thumbnailMeta: thumbnailMetaMap[d.thumbnail] }
          : {}),
      }));
      return { list: resultList, total, page, size, totalPage };
    }

    // 已登录用户，优先推荐与点赞日记tag相关的
    // 1. 找到用户点赞过的日记的所有tag
    const likedDiaries = await this.prisma.like.findMany({
      where: { userId },
      select: { diary: { select: { tags: { select: { id: true } } } } },
    });
    const tagIds = Array.from(
      new Set(
        likedDiaries.flatMap((like) => like.diary.tags.map((tag) => tag.id)),
      ),
    );
    // 2. 找到用户已点赞的日记id
    const likedDiaryIds = await this.prisma.like.findMany({
      where: { userId },
      select: { diaryId: true },
    });
    const likedDiaryIdSet = new Set(likedDiaryIds.map((d) => d.diaryId));
    // 3. 查询所有未点赞过的相关tag日记id
    let tagDiaryIds: string[] = [];
    if (tagIds.length > 0) {
      const tagDiaries = await this.prisma.diary.findMany({
        where: {
          published: true,
          status: 'Approved',
          tags: { some: { id: { in: tagIds } } },
          id: { notIn: Array.from(likedDiaryIdSet) },
        },
        select: { id: true },
      });
      tagDiaryIds = tagDiaries.map((d) => d.id);
    }
    // 4. 查询所有未点赞过的热门日记id（不含tag相关）
    const hotDiaries = await this.prisma.diary.findMany({
      where: {
        published: true,
        status: 'Approved',
        id: {
          notIn: Array.from(new Set([...tagDiaryIds, ...likedDiaryIdSet])),
        },
      },
      orderBy: [
        { likeCount: 'desc' },
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      select: { id: true },
    });
    const allRecommendIds = [...tagDiaryIds, ...hotDiaries.map((d) => d.id)];
    let pageIds = allRecommendIds.slice((page - 1) * size, page * size);
    let list: any[] = [];
    let total = allRecommendIds.length;

    // 兜底：如果未点赞的推荐数量不足 size，则补充已点赞过的热门日记
    if (pageIds.length < size) {
      // 查询所有已点赞过的热门日记id
      const likedHotDiaries = await this.prisma.diary.findMany({
        where: {
          published: true,
          status: 'Approved',
          id: { in: Array.from(likedDiaryIdSet) },
        },
        orderBy: [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
          { publishedAt: 'desc' },
        ],
        select: { id: true },
      });
      // 只补充当前页缺少的数量，且避免重复
      const fillCount = size - pageIds.length;
      const fillIds = likedHotDiaries
        .map((d) => d.id)
        .filter((id) => !pageIds.includes(id))
        .slice(0, fillCount);
      pageIds = [...pageIds, ...fillIds];
      // 兜底后，total 需要去重统计
      const totalSet = new Set([
        ...allRecommendIds,
        ...likedHotDiaries.map((d) => d.id),
      ]);
      total = totalSet.size;
    }

    // 查询详情
    if (pageIds.length > 0) {
      list = await this.prisma.diary.findMany({
        where: { id: { in: pageIds } },
        select: diarySelect,
      });
      // 保证顺序与pageIds一致
      const idOrder = new Map(pageIds.map((id, idx) => [id, idx]));
      list.sort((a, b) => idOrder.get(a.id)! - idOrder.get(b.id)!);
    }
    // 7. 批量查 isLiked 和 thumbnailMeta
    let likedIds: string[] = [];
    let thumbnailMetaMap: Record<string, any> = {};
    if (list.length > 0) {
      const thumbnailKeys = list
        .map((d) => d.thumbnail)
        .filter((k): k is string => !!k);
      thumbnailMetaMap =
        await this.ossService.getOssObjectsByKeys(thumbnailKeys);
    }
    if (userId && list.length > 0) {
      const diaryIds = list.map((d) => d.id);
      const likes = await this.prisma.like.findMany({
        where: { userId, diaryId: { in: diaryIds } },
        select: { diaryId: true },
      });
      likedIds = likes.map((l) => l.diaryId);
    }
    const resultList = list.map((d) => ({
      ...d,
      isLiked: likedIds.includes(d.id),
      ...(d.thumbnail ? { thumbnailMeta: thumbnailMetaMap[d.thumbnail] } : {}),
    }));
    const totalPage = Math.ceil(total / size);
    return { list: resultList, total, page, size, totalPage };
  }

  async shareDiary(id: string) {
    await this.trackService.trackDiaryShare(id);
    await this.trackStatsService.incr('diary_share', new Date(), 1);
    return { message: '分享已记录' };
  }
}
