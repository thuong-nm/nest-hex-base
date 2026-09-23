import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import { AuthErrors } from '../../domain/errors/auth.errors.js';
import type { LoginCommand } from '../dto/login.command.js';
import type { SessionResult } from '../dto/session.result.js';
import type { RefreshTokenRepository } from '../ports/refresh-token.repository.port.js';
import type { UserAccountPort } from '../ports/user-account.port.js';
import type { SessionIssuer } from '../services/session-issuer.js';

export class LoginUseCase {
  constructor(
    private readonly accounts: UserAccountPort,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly sessions: SessionIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(command: LoginCommand): Promise<SessionResult> {
    const account = await this.accounts.verifyCredentials(command);
    if (!account) throw AuthErrors.invalidCredentials();
    // Only reachable with the correct password, so it does not reveal that the email exists.
    if (account.status !== 'ACTIVE') throw AuthErrors.accountDisabled();

    const refresh = this.sessions.newRefreshToken(
      account,
      this.sessions.newFamilyId(),
      this.clock.now(),
    );
    await this.refreshTokens.create(refresh.entity);
    return this.sessions.toSession(account, refresh);
  }
}
