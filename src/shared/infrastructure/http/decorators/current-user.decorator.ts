import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../auth-context.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    // Reaching this on a @Public() route is a programming error, not a client error.
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
