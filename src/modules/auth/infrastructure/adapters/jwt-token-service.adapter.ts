import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '#src/shared/infrastructure/config/app-config.service.js';
import type { AccessTokenClaims } from '#src/shared/infrastructure/http/auth-context.js';
import type {
  OpaqueToken,
  SignedAccessToken,
  TokenService,
} from '../../application/ports/token-service.port.js';

/**
 * Access tokens: HS256 JWTs signed with the JwtModule configured in shared/infrastructure/http,
 * which JwtAuthGuard verifies. Refresh tokens: opaque random strings. SHA-256 is enough for
 * those (they carry 384 bits of entropy, so a slow hash adds nothing) and allows direct lookup.
 */
@Injectable()
export class JwtTokenServiceAdapter implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async signAccessToken(claims: { userId: string; role: string }): Promise<SignedAccessToken> {
    const payload: AccessTokenClaims = { sub: claims.userId, role: claims.role };
    return {
      token: await this.jwt.signAsync(payload),
      expiresInSeconds: this.config.get('JWT_ACCESS_TTL_SECONDS'),
    };
  }

  generateRefreshToken(): OpaqueToken {
    const token = randomBytes(48).toString('base64url');
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
