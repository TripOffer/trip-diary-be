import { IsString, IsIn, IsDateString } from 'class-validator';

export class StatsSummaryDto {
  @IsString()
  type: string;

  @IsIn(['day', 'week', 'month'])
  period: 'day' | 'week' | 'month' = 'day';

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}
