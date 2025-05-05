import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewDiaryQueryDto {
  @IsOptional()
  @IsString()
  status?: string; // Pending, Approved, Rejected

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn([
    'createdAt',
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
