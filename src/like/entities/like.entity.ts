// import { Field, ObjectType } from '@nestjs/graphql'; // Removed
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

// @ObjectType() // Removed
export class Like {
  // @Field() // Removed
  id: string;

  // @Field(() => User) // Removed
  user: User;

  // @Field(() => Post) // Removed
  post: Post;
}
