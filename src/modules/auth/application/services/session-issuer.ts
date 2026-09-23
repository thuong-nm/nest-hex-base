import type { IdGenerator } from '#src/shared/kernel/ports/id-generator.port.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import type { SessionResult } from '../dto/session.result.js';
import type { AuthSettings } from '../ports/auth-settings.port.js';
import type { UserAccount } from '../ports/user-account.port.js';
import type { TokenService } from '../ports/token-service.port.js';

/** Shared by login (new family) and refresh (same family). Does not persist anything. */
export class SessionIssuer {
  constructor(
    private readonly tokens: TokenService,
    private readonly ids: IdGenerator,
    private readonly settings: AuthSettings,
  ) {}

  newRefreshToken(
    account: UserAccount,
    familyId: string,
    now: Date,
  ): { entity: RefreshToken; plain: string } {
    const { token, hash } = this.tokens.generateRefreshToken();
    const entity = RefreshToken.issue({
      id: this.ids.generate(),
      userId: account.id,
      familyId,
      tokenHash: hash,
      now,
      ttlSeconds: this.settings.refreshTokenTtlSeconds,
    });
    return { entity, plain: token };
  }

  async toSession(
    account: UserAccount,
    refresh: { entity: RefreshToken; plain: string },
  ): Promise<SessionResult> {
    const access = await this.tokens.signAccessToken({ userId: account.id, role: account.role });
    return {
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresInSeconds,
      refreshToken: refresh.plain,
      refreshTokenExpiresAt: refresh.entity.expiresAt,
    };
  }

  newFamilyId(): string {
    return this.ids.generate();
  }
}
