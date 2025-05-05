import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDiaryDto } from './dto/search.dto';
import { OptionalJwtAuthGuard } from 'src/auth/guards/jwt-auth/optional-jwt-auth.guard';

@Controller('diary/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async searchDiaries(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: SearchDiaryDto,
    @Req() req,
  ) {
    return this.searchService.searchDiaries(query, req.user?.id);
  }
}
