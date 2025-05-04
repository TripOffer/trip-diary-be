import { IsBoolean } from 'class-validator';

export class UpdateDiaryPublishInput {
  @IsBoolean()
  published: boolean;
}
