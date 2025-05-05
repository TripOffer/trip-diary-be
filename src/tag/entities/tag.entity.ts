import { Diary } from 'src/diary/entities/diary.entity';

export class Tag {
  id: string;

  name: string;

  diaries: Diary[];
}
