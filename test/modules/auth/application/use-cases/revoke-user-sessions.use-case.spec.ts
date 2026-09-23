import { authTestKit } from '#test/fakes/auth/auth-test-kit.js';
import { LoginUseCase } from '#src/modules/auth/application/use-cases/login.use-case.js';
import { RevokeUserSessionsUseCase } from '#src/modules/auth/application/use-cases/revoke-user-sessions.use-case.js';

describe('RevokeUserSessionsUseCase', () => {
  it('revokes every refresh token of the user and no one else', async () => {
    const kit = authTestKit();
    kit.accounts.add({ email: 'jane@example.com', password: 'x' });
    const bob = kit.accounts.add({ email: 'bob@example.com', password: 'x' });
    const login = new LoginUseCase(kit.accounts, kit.refreshTokens, kit.sessions, kit.clock);
    await login.execute({ email: 'jane@example.com', password: 'x' });
    await login.execute({ email: 'jane@example.com', password: 'x' });
    await login.execute({ email: 'bob@example.com', password: 'x' });
    const jane = kit.refreshTokens.all()[0]!.userId;

    await new RevokeUserSessionsUseCase(kit.refreshTokens, kit.clock).execute(jane);

    const tokens = kit.refreshTokens.all();
    expect(tokens.filter((t) => t.userId === jane).every((t) => t.isRevoked)).toBe(true);
    expect(tokens.filter((t) => t.userId === bob.id).every((t) => !t.isRevoked)).toBe(true);
  });
});
