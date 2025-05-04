import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum DiaryReviewStatus {
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export class ReviewDiaryInput {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsEnum(DiaryReviewStatus)
  status: DiaryReviewStatus;

  @IsOptional()
  @IsString()
  rejectedReason?: string;
}
