import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateDiaryInput } from './create-diary.input';
import { IsInt } from 'class-validator';

export class UpdateDiaryInput extends PartialType(CreateDiaryInput) {
  @IsInt()
  id: number;
}
