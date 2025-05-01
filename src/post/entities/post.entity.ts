import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Comment } from 'src/comment/entities/comment.entity';
import { Like } from 'src/like/entities/like.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
export class Post {
  @Field(() => String)
  id: string;

  @Field(() => User)
  author: User;

  @Field()
  title: string;

  @Field(() => [Tag])
  tags: Tag[];

  @Field(() => [Comment])
  comments: Comment[];

  @Field()
  slug: string;

  @Field()
  content: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string | null;

  @Field(() => [String], { nullable: 'itemsAndList' })
  images?: string[];

  @Field(() => String, { nullable: true })
  video?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
