import { IsString } from 'class-validator';

export class ConfirmUploadInputDto {
  @IsString({ message: 'key 必填' })
  key: string;
}
