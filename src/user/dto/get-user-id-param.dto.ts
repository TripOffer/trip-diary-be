import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserIdParamDto {
  @Type(() => Number)
  @IsInt({ message: 'id 必须为整数' })
  @Min(1, { message: 'id 最小为 1' })
  id: number;
}
