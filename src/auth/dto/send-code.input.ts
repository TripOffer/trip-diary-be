import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendCodeInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
