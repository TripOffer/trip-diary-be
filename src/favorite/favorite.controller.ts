import { Controller } from '@nestjs/common';
import { FavoriteService } from './favorite.service';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}
}
