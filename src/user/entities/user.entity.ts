import { Comment } from 'src/comment/entities/comment.entity';
import { Post } from 'src/post/entities/post.entity';

export class User {
  id: number;

  name: string;

  email: string;

  // Consider using @Exclude() from class-transformer if password should not be sent in responses
  password: string;

  bio?: string | null;

  avatar?: string | null;

  posts?: Post[];

  comments?: Comment[];
}
