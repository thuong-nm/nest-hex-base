import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { TransactionRunner } from '#src/shared/kernel/ports/transaction-runner.port.js';
import { AuthErrors } from '../../domain/errors/auth.errors.js';
import type { RefreshSessionCommand } from '../dto/refresh-session.command.js';
import type { SessionResult } from '../dto/session.result.js';
import type { RefreshTokenRepository } from '../ports/refresh-token.repository.port.js';
import type { TokenService } from '../ports/token-service.port.js';
import type { UserAccountPort } from '../ports/user-account.port.js';
import type { SessionIssuer } from '../services/session-issuer.js';

/**
 * Rotating refresh tokens: each refresh token works once. Presenting a revoked one means it was
 * stolen or replayed, so the whole family (every token descended from that login) is revoked.
 */
export class RefreshSessionUseCase {
  constructor(
    private readonly accounts: UserAccountPort,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly sessions: SessionIssuer,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<SessionResult> {
    const now = this.clock.now();
    const current = await this.refreshTokens.findByHash(
      this.tokens.hashRefreshToken(command.refreshToken),
    );
    if (!current) throw AuthErrors.invalidRefreshToken();

    if (current.isRevoked) {
      await this.refreshTokens.revokeFamily(current.familyId, now);
      throw AuthErrors.refreshTokenReused();
    }
    if (current.isExpired(now)) throw AuthErrors.invalidRefreshToken();

    const account = await this.accounts.findById(current.userId);
    if (!account || account.status !== 'ACTIVE') {
      await this.refreshTokens.revokeFamily(current.familyId, now);
      throw account ? AuthErrors.accountDisabled() : AuthErrors.invalidRefreshToken();
    }

    const next = this.sessions.newRefreshToken(account, current.familyId, now);
    const rotated = await this.transactions.run(async () => {
      current.revoke(now, next.entity.id);
      // Loses the race if a concurrent request rotated the same token first: that is reuse too.
      if (!(await this.refreshTokens.revokeIfActive(current))) return false;
      await this.refreshTokens.create(next.entity);
      return true;
    });
    if (!rotated) {
      await this.refreshTokens.revokeFamily(current.familyId, now);
      throw AuthErrors.refreshTokenReused();
    }

    return this.sessions.toSession(account, next);
  }
}
