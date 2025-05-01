import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  avatar?: string | null;
}
