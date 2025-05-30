import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { ReviewerGuard } from 'src/auth/guards/reviewer.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth/optional-jwt-auth.guard';
import { DiaryService } from './diary.service';
import { CreateDiaryInput } from './dto/create-diary.input';
import { ReviewDiaryQueryDto } from './dto/review-diary-query.dto';
import { ReviewDiaryInput } from './dto/review-diary.input';
import { UpdateDiaryPublishInput } from './dto/update-diary-publish.input';
import { UpdateDiaryInput } from './dto/update-diary.input';
import { GetUserDiariesQueryDto } from './dto/get-user-diaries-query.dto';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDiaryInput: CreateDiaryInput, @Req() req) {
    return this.diaryService.create(createDiaryInput, req.user.id);
  }

  @UseGuards(JwtAuthGuard, ReviewerGuard)
  @Get('review-list')
  async getReviewList(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ReviewDiaryQueryDto,
  ) {
    return this.diaryService.reviewList(query);
  }

  @Get('recommend')
  @UseGuards(OptionalJwtAuthGuard)
  async recommendDiaries(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetUserDiariesQueryDto,
    @Req() req,
  ) {
    return this.diaryService.recommendDiaries(
      query.page,
      query.size,
      req.user?.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateDiary(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: UpdateDiaryInput,
    @Req() req,
  ) {
    return this.diaryService.updateDiary(id, input, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDiary(@Param('id') id: string, @Req() req) {
    return this.diaryService.deleteDiary(id, req.user);
  }

  @UseGuards(JwtAuthGuard, ReviewerGuard)
  @Post(':id/review')
  async reviewDiary(
    @Param('id') id: string,
    @Body() input: Omit<ReviewDiaryInput, 'id'>,
    @Req() req,
  ) {
    return this.diaryService.reviewDiary({ ...input, id }, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  async updateDiaryPublish(
    @Param('id') id: string,
    @Body() input: UpdateDiaryPublishInput,
    @Req() req,
  ) {
    return this.diaryService.updateDiaryPublish(id, input.published, req.user);
  }

  @Get(':id/detail')
  @UseGuards(OptionalJwtAuthGuard)
  async getDiaryDetail(
    @Param('id') id: string,
    @Req() req,
    @Query('noHistory') noHistory?: string,
  ) {
    return this.diaryService.getDiaryDetail(
      id,
      req.user?.id,
      noHistory === '1' || noHistory === 'true',
    );
  }

  @Post(':id/share')
  async shareDiary(@Param('id') id: string) {
    return this.diaryService.shareDiary(id);
  }
}
