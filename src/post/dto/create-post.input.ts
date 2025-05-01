import { IsInt } from 'class-validator';

export class CreatePostInput {
  @IsInt()
  exampleField: number;
}
