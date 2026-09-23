import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DomainError } from '#src/shared/kernel/errors/domain.error.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import type { AccessTokenClaims, AuthenticatedRequest } from '../auth-context.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

const unauthorized = () => new DomainError(CommonErrorCode.UNAUTHORIZED, { kind: 'UNAUTHORIZED' });

/** Global guard: every route requires a valid access token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & { headers: { authorization?: string } }>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) throw unauthorized();

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
    } catch {
      // Expired, malformed and badly signed tokens all get the same answer.
      throw unauthorized();
    }
    if (typeof claims.sub !== 'string' || typeof claims.role !== 'string') throw unauthorized();

    req.user = { id: claims.sub, role: claims.role };
    return true;
  }
}
