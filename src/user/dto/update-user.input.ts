import { PartialType } from '@nestjs/mapped-types'; // Changed import
import { CreateUserInput } from './create-user.input';
import { IsInt, IsOptional, IsString, IsIn, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthday?: Date;
}
