import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateUserInput } from './create-user.input';
import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserInput {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'secret'])
  gender?: string;
}
