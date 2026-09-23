import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '#src/shared/kernel/errors/domain.error.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import type { AuthenticatedRequest } from '../auth-context.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/** Global guard, runs after JwtAuthGuard. No-op unless the route has @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new DomainError(CommonErrorCode.UNAUTHORIZED, { kind: 'UNAUTHORIZED' });
    if (!roles.includes(user.role)) {
      throw new DomainError(CommonErrorCode.FORBIDDEN, { kind: 'FORBIDDEN' });
    }
    return true;
  }
}
