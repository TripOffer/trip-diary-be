import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreatePostInput } from './create-post.input';
import { IsInt } from 'class-validator';

export class UpdatePostInput extends PartialType(CreatePostInput) {
  @IsInt()
  id: number;
}
