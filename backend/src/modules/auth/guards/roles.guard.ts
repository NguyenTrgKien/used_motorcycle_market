import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@project/shared';
import { ROLES_KEY } from 'src/common/decorators/role.decorator';
import { RequestWithUser } from '../auth.controller';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!requiredRoles.includes(user.role)) {
      throw new Error('Bạn không có quyền truy cập vào tài nguyên này');
    }
    return true;
  }
}
