import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDiaryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn([
    'publishedAt',
    'viewCount',
    'likeCount',
    'favoriteCount',
    'commentCount',
  ])
  sort?: string = 'publishedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 10;
}
