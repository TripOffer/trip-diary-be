import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchDiaryDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchDiaries(dto: SearchDiaryDto) {
    const {
      query,
      sort = 'publishedAt',
      order = 'desc',
      page = 1,
      size = 10,
    } = dto;
    const where: any = {
      published: true,
      status: 'Approved',
    };
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
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
          content: true,
          publishedAt: true,
          viewCount: true,
          likeCount: true,
          favoriteCount: true,
          commentCount: true,
          thumbnail: true,
          author: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.diary.count({ where }),
    ]);
    const totalPage = Math.ceil(total / size);
    return { list, total, page, size, totalPage };
  }
}
