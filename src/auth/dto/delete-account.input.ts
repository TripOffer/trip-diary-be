import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountInput {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
