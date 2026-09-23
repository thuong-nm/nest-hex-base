import { SessionIssuer } from '#src/modules/auth/application/services/session-issuer.js';
import { FixedClock } from '../fixed-clock.js';
import { ImmediateTransactionRunner } from '../immediate-transaction-runner.js';
import { SequentialIdGenerator } from '../sequential-id-generator.js';
import { FakeTokenService } from './fake-token-service.js';
import { FakeUserAccounts } from './fake-user-account.js';
import { InMemoryRefreshTokenRepository } from './in-memory-refresh-token.repository.js';

export const REFRESH_TTL_SECONDS = 3600;

/** Wires the auth use cases' collaborators the same way auth.module.ts does, with fakes. */
export function authTestKit() {
  const accounts = new FakeUserAccounts();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const tokens = new FakeTokenService();
  const clock = new FixedClock();
  const transactions = new ImmediateTransactionRunner();
  const sessions = new SessionIssuer(tokens, new SequentialIdGenerator(), {
    refreshTokenTtlSeconds: REFRESH_TTL_SECONDS,
  });
  return { accounts, refreshTokens, tokens, clock, transactions, sessions };
}
