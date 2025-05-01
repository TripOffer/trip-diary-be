import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateLikeInput } from './create-like.input';
import { IsInt } from 'class-validator';

export class UpdateLikeInput extends PartialType(CreateLikeInput) {
  @IsInt()
  id: number;
}
