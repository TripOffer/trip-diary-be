import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
export class Favorite {
  @Field()
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Post)
  post: Post;
}
