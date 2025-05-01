import { Comment } from 'src/comment/entities/comment.entity';
import { Post } from 'src/post/entities/post.entity';

export class User {
  id: number;
  name: string;
  email: string;
  password: string;
  bio?: string | null;
  avatar?: string | null;
  role: string;
  posts?: Post[];
  comments?: Comment[];
}
