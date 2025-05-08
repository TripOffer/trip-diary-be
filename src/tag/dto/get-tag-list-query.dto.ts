import { IsInt, Min, IsOptional, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTagListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须为整数' })
  @Min(1, { message: 'page 最小为 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'size 必须为整数' })
  @Min(1, { message: 'size 最小为 1' })
  @Max(100, { message: 'size 最大为 100' })
  size?: number = 10;

  @IsOptional()
  @IsIn(['viewCount', 'diaryCount'], {
    message: 'sort 只允许 viewCount 或 diaryCount',
  })
  sort?: 'viewCount' | 'diaryCount' = 'viewCount';
}
