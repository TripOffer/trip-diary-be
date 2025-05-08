import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackStatsService } from '../../track/track-stats.service';

@Injectable()
export class FavoriteService {
  constructor(
    private prisma: PrismaService,
    private trackStatsService: TrackStatsService,
  ) {}

  async favoriteDiary(userId: number, diaryId: string) {
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
      select: { id: true },
    });
    if (!diary) throw new NotFoundException('日记不存在');
    const exist = await this.prisma.favorite.findUnique({
      where: { userId_diaryId: { userId, diaryId } },
    });
    if (exist) throw new BadRequestException('已收藏');
    await this.prisma.favorite.create({
      data: { userId, diaryId },
      select: { userId: true, diaryId: true },
    });
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { favoriteCount: { increment: 1 } },
      select: { id: true },
    });
    await this.trackStatsService.incr('diary_favorite', new Date(), 1);
    return { message: '收藏成功' };
  }

  async unfavoriteDiary(userId: number, diaryId: string) {
    const exist = await this.prisma.favorite.findUnique({
      where: { userId_diaryId: { userId, diaryId } },
    });
    if (!exist) throw new BadRequestException('未收藏');
    await this.prisma.favorite.delete({
      where: { userId_diaryId: { userId, diaryId } },
      select: { userId: true, diaryId: true },
    });
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { favoriteCount: { decrement: 1 } },
      select: { id: true },
    });
    await this.trackStatsService.incr('diary_favorite', new Date(), -1);
    return { message: '已取消收藏' };
  }
}
