import { Diary } from 'src/diary/entities/diary.entity';
import { User } from 'src/user/entities/user.entity';

export class Comment {
  id: string;
  content: string;
  diary: Diary;
  author: User;
  createdAt: Date;
}

export class CommentEntity {
  id: string;
  diaryId: string;
  authorId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  likeCount: number;
  replyCount: number;
  // 可根据需要扩展更多字段，如作者信息、是否已点赞等
}
