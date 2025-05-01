import { Comment } from 'src/comment/entities/comment.entity';
import { Like } from 'src/like/entities/like.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { User } from 'src/user/entities/user.entity';

export class Post {
  id: string;

  author: User;

  title: string;

  tags: Tag[];

  comments: Comment[];

  slug: string;

  content: string;

  thumbnail?: string | null;

  images?: string[];

  video?: string | null;

  createdAt: Date;

  updatedAt: Date;
}
