import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateCommentInput } from './create-comment.input';
import { IsInt } from 'class-validator';

export class UpdateCommentInput extends PartialType(CreateCommentInput) {
  @IsInt()
  id: number;
}
