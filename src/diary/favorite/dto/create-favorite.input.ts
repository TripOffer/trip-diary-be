import { IsInt } from 'class-validator';

export class CreateFavoriteInput {
  @IsInt()
  exampleField: number;
}
