import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { RefreshTokenRepository } from '../ports/refresh-token.repository.port.js';

/** Invoked when a user is disabled, so they cannot refresh their way back in. */
export class RevokeUserSessionsUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string): Promise<void> {
    return this.refreshTokens.revokeAllForUser(userId, this.clock.now());
  }
}
