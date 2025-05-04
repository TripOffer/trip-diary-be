import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDiaryDto } from './dto/search.dto';

@Controller('diary/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async searchDiaries(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: SearchDiaryDto,
  ) {
    return this.searchService.searchDiaries(query);
  }
}
