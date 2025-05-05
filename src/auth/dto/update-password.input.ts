import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordInput {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
