// import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Diary } from 'src/diary/entities/diary.entity';
import { User } from 'src/user/entities/user.entity';

// @ObjectType()
export class Comment {
  // @Field(() => String)
  id: string;

  // @Field()
  content: string;

  // @Field(() => Post)
  diary: Diary;

  // @Field(() => User)
  author: User;

  // @Field()
  createdAt: Date;
}
