import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ReviewerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (
      !user ||
      (user.role !== 'Admin' &&
        user.role !== 'Super' &&
        user.role !== 'Reviewer')
    ) {
      throw new ForbiddenException('无权限，只有审核员和管理员可以操作');
    }
    return true;
  }
}
