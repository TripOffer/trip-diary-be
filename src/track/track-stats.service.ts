import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export type TrackStatsPeriod = 'day' | 'week' | 'month';

@Injectable()
export class TrackStatsService {
  constructor(private prisma: PrismaService) {}

  // 自增某一天某类型的统计
  async incr(type: string, date: Date, value = 1) {
    const day = startOfDay(date);
    await this.prisma.trackStats.upsert({
      where: { type_date: { type, date: day } },
      update: { value: { increment: value } },
      create: { type, date: day, value },
    });
  }

  // 设置某一天某类型的统计（如每日快照）
  async set(type: string, date: Date, value: number) {
    const day = startOfDay(date);
    await this.prisma.trackStats.upsert({
      where: { type_date: { type, date: day } },
      update: { value },
      create: { type, date: day, value },
    });
  }

  // 查询某类型在某区间的每日统计（用于折线图）
  async getRange(type: string, start: Date, end: Date) {
    const rows = await this.prisma.trackStats.findMany({
      where: {
        type,
        date: { gte: startOfDay(start), lte: endOfDay(end) },
      },
      orderBy: { date: 'asc' },
    });
    return rows;
  }

  // 查询某类型在某区间的周/月统计（自动聚合）
  async getRangeAgg(
    type: string,
    start: Date,
    end: Date,
    period: TrackStatsPeriod,
  ) {
    const rows = await this.getRange(type, start, end);
    const result: { label: string; value: number }[] = [];
    if (period === 'day') {
      for (const row of rows) {
        result.push({
          label: row.date.toISOString().slice(0, 10),
          value: row.value,
        });
      }
    } else if (period === 'week') {
      const weekMap = new Map<string, number>();
      for (const row of rows) {
        const weekStart = startOfWeek(row.date, { weekStartsOn: 1 });
        const key = weekStart.toISOString().slice(0, 10);
        weekMap.set(key, (weekMap.get(key) || 0) + row.value);
      }
      for (const [label, value] of weekMap) {
        result.push({ label, value });
      }
      result.sort((a, b) => a.label.localeCompare(b.label));
    } else if (period === 'month') {
      const monthMap = new Map<string, number>();
      for (const row of rows) {
        const month =
          row.date.getFullYear() +
          '-' +
          String(row.date.getMonth() + 1).padStart(2, '0');
        monthMap.set(month, (monthMap.get(month) || 0) + row.value);
      }
      for (const [label, value] of monthMap) {
        result.push({ label, value });
      }
      result.sort((a, b) => a.label.localeCompare(b.label));
    }
    return result;
  }
}
