import { IsInt } from 'class-validator';

export class CreateLikeInput {
  @IsInt()
  exampleField: number;
}
