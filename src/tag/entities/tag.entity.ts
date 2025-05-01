import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Post } from 'src/post/entities/post.entity';

@ObjectType()
export class Tag {
  @Field(() => String)
  id: string;

  @Field()
  name: string;

  @Field(() => [Post])
  posts: Post[];
}
