import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateFavoriteInput } from './create-favorite.input';
import { IsInt } from 'class-validator';

export class UpdateFavoriteInput extends PartialType(CreateFavoriteInput) {
  @IsInt()
  id: number;
}
