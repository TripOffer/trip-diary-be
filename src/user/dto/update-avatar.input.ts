import { IsString } from 'class-validator';

export class UpdateAvatarInput {
  @IsString()
  avatar: string;
}
