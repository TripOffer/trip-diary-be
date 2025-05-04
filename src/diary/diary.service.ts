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

@Injectable()
export class DiaryService {
  constructor(
    private prisma: PrismaService,
    private tagService: TagService,
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
    if (user.role !== 'Admin' && user.id !== diary.authorId) {
      throw new BadRequestException('无权限操作');
    }
    await this.prisma.diary.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async getUserDiaries(id: number, input: GetUserDiariesQueryDto) {
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
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
  }

  async getAllUserDiaries(id: number, input: GetUserDiariesQueryDto) {
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
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
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

  async getDiaryDetail(id: string) {
    const diary = await this.prisma.diary.findUnique({
      where: { id },
      select: diaryDetailSelect,
    });
    if (!diary) throw new NotFoundException('日记不存在');
    return diary;
  }
}
