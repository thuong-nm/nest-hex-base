import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { LogoutCommand } from '../dto/logout.command.js';
import type { RefreshTokenRepository } from '../ports/refresh-token.repository.port.js';
import type { TokenService } from '../ports/token-service.port.js';

/**
 * Revokes the presented refresh token. Always succeeds, so the endpoint cannot be used to probe
 * which tokens are valid. The access token stays valid until it expires (it is short-lived).
 */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const token = await this.refreshTokens.findByHash(
      this.tokens.hashRefreshToken(command.refreshToken),
    );
    if (!token || token.isRevoked) return;
    token.revoke(this.clock.now());
    await this.refreshTokens.revokeIfActive(token);
  }
}
