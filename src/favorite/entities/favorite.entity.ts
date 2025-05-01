import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

export class Favorite {
  id: string;
  user: User;
  post: Post;
}
