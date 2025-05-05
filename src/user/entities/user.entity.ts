import { Comment } from 'src/diary/comment/entities/comment.entity';
import { Diary } from 'src/diary/entities/diary.entity';

export class User {
  id: number;
  name: string;
  email: string;
  password: string;
  bio?: string | null;
  avatar?: string | null;
  gender: string | 'secret' | 'male' | 'female';
  birthday?: Date | null;
  role: string;
  diaries?: Diary[];
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
