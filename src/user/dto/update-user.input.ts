import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateUserInput } from './create-user.input';
import { IsInt } from 'class-validator';

export class UpdateUserInput extends PartialType(CreateUserInput) {
  @IsInt()
  id: number;
}
