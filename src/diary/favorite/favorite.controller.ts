import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { FavoriteService } from './favorite.service';

@Controller('diary')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async favorite(@Param('id') diaryId: string, @Req() req) {
    return this.favoriteService.favoriteDiary(req.user.id, diaryId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  async unfavorite(@Param('id') diaryId: string, @Req() req) {
    return this.favoriteService.unfavoriteDiary(req.user.id, diaryId);
  }
}
