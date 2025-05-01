import { AuthUser } from './auth-user.entity';

export class AuthPayload {
  token: string;
  user: AuthUser;
}
