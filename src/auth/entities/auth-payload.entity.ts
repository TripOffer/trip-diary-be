import { Field, ObjectType } from '@nestjs/graphql';
import { AuthUser } from './auth-user.entity'; // Import the new AuthUser type

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => AuthUser) // Provide explicit type function () => AuthUser
  user: AuthUser; // Change type to AuthUser
}
