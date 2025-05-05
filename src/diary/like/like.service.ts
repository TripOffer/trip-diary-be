import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  async likeDiary(userId: number, diaryId: string) {
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
      select: { id: true },
    });
    if (!diary) throw new NotFoundException('日记不存在');
    const exist = await this.prisma.like.findUnique({
      where: { userId_diaryId: { userId, diaryId } },
    });
    if (exist) throw new BadRequestException('已点赞');
    await this.prisma.like.create({
      data: { userId, diaryId },
      select: { userId: true, diaryId: true },
    });
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { likeCount: { increment: 1 } },
      select: { id: true },
    });
    return { message: '点赞成功' };
  }

  async unlikeDiary(userId: number, diaryId: string) {
    const exist = await this.prisma.like.findUnique({
      where: { userId_diaryId: { userId, diaryId } },
    });
    if (!exist) throw new BadRequestException('未点赞');
    await this.prisma.like.delete({
      where: { userId_diaryId: { userId, diaryId } },
      select: { userId: true, diaryId: true },
    });
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { likeCount: { decrement: 1 } },
      select: { id: true },
    });
    return { message: '已取消点赞' };
  }
}
