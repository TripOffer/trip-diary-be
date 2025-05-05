import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentInput {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
