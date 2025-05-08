import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ReviewerGuard } from '../auth/guards/reviewer.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import {
  TrackStatsService,
  TrackStatsPeriod,
} from '../track/track-stats.service';
import { parseISO } from 'date-fns';
import { StatsSummaryDto } from './dto/stats-summary.dto';
import { ValidationPipe } from '@nestjs/common';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly trackStatsService: TrackStatsService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  async getAdminStats(@Req() req) {
    return this.statsService.getAdminStats();
  }

  @Get('reviewer')
  @UseGuards(JwtAuthGuard, ReviewerGuard)
  async getReviewerStats(@Req() req) {
    return this.statsService.getReviewerStats();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('summary')
  async getStatsSummary(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    dto: StatsSummaryDto,
  ) {
    const { type, period, start, end } = dto;
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return this.trackStatsService.getRangeAgg(type, startDate, endDate, period);
  }
}
