import { Controller, Get, Query, Param, Req, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { GetTagListQueryDto } from './dto/get-tag-list-query.dto';
import { ValidationPipe } from '@nestjs/common';
import { GetTagDiariesQueryDto } from './dto/get-tag-diaries-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth/optional-jwt-auth.guard';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('hot')
  async getHotTags(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetTagListQueryDto,
  ) {
    const result = await this.tagService.getHotTags(query);
    return result;
  }

  @Get(':id/diaries')
  @UseGuards(OptionalJwtAuthGuard)
  async getTagDiaries(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetTagDiariesQueryDto,
  ) {
    return this.tagService.getTagDiaries(id, query);
  }

  @Get(':id')
  async getTagById(@Param('id') id: string) {
    return this.tagService.getTagById(id);
  }

  @Get()
  async getTagByName(@Query('name') name: string) {
    return this.tagService.getTagByName(name);
  }
}
