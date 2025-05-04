import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [DiaryService, PrismaService],
  controllers: [DiaryController],
})
export class DiaryModule {}
