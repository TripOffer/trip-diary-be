import { IsOptional, IsString, IsInt, Min, IsIn, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserListQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['', 'User', 'Reviewer', 'Admin', 'Super'], { message: '角色不合法' })
  role?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 10;
}
