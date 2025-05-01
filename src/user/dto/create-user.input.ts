import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String)
  password: string;

  @Field()
  @IsEmail()
  email: string;
}
