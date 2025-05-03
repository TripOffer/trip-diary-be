import { IsIn } from 'class-validator';

export class ChangeUserRoleInput {
  @IsIn(['User', 'Reviewer', 'Admin'], {
    message: '角色只能是 User、Reviewer 或 Admin',
  })
  role: 'User' | 'Reviewer' | 'Admin';
}
