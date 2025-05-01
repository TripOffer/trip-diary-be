import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserInput {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;
}
