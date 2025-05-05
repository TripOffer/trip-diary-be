import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || (user.role !== 'Admin' && user.role !== 'Super')) {
      throw new ForbiddenException('无权限，只有管理员可以操作');
    }
    return true;
  }
}
