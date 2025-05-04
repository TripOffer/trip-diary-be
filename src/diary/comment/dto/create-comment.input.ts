import { IsInt } from 'class-validator';

export class CreateCommentInput {
  @IsInt()
  exampleField: number;
}
