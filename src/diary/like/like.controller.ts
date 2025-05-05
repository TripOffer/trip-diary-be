import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { LikeService } from './like.service';

@Controller('diary')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async like(@Param('id') diaryId: string, @Req() req) {
    return this.likeService.likeDiary(req.user.id, diaryId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlike(@Param('id') diaryId: string, @Req() req) {
    return this.likeService.unlikeDiary(req.user.id, diaryId);
  }
}
