import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateTagInput } from './create-tag.input';
import { IsInt } from 'class-validator';

export class UpdateTagInput extends PartialType(CreateTagInput) {
  @IsInt()
  id: number;
}
