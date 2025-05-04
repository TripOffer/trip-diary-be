import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryInput } from './dto/create-diary.input';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDiaryInput: CreateDiaryInput, @Req() req) {
    return this.diaryService.create(createDiaryInput, req.user.id);
  }
}
