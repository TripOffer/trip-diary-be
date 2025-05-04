import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDiaryInput } from './dto/create-diary.input';
import slugify from 'slugify';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  async create(createDiaryInput: CreateDiaryInput, authorId: number) {
    const { title, content, tagIds, images, video, thumbnail, published } =
      createDiaryInput;
    // 使用 slugify 生成 slug
    const slug =
      slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const diary = await this.prisma.diary.create({
      data: {
        title,
        content,
        slug,
        authorId,
        images: images || [],
        video,
        thumbnail,
        published: published ?? false,
        tags:
          tagIds && tagIds.length > 0
            ? {
                connect: tagIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: { tags: true },
    });
    return diary;
  }
}
