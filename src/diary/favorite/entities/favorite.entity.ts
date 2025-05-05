import { Diary } from 'src/diary/entities/diary.entity';
import { User } from 'src/user/entities/user.entity';

export class Favorite {
  id: string;
  user: User;
  diary: Diary;
}
