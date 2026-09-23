import { authTestKit } from '#test/fakes/auth/auth-test-kit.js';
import { LoginUseCase } from '#src/modules/auth/application/use-cases/login.use-case.js';
import { LogoutUseCase } from '#src/modules/auth/application/use-cases/logout.use-case.js';

describe('LogoutUseCase', () => {
  it('revokes the presented refresh token only', async () => {
    const kit = authTestKit();
    kit.accounts.add({ email: 'jane@example.com', password: 'Password123' });
    const login = new LoginUseCase(kit.accounts, kit.refreshTokens, kit.sessions, kit.clock);
    const a = await login.execute({ email: 'jane@example.com', password: 'Password123' });
    await login.execute({ email: 'jane@example.com', password: 'Password123' });

    await new LogoutUseCase(kit.refreshTokens, kit.tokens, kit.clock).execute({
      refreshToken: a.refreshToken,
    });

    const tokens = kit.refreshTokens.all();
    expect(tokens.filter((t) => t.isRevoked)).toHaveLength(1);
    expect(tokens.find((t) => t.isRevoked)?.tokenHash).toBe(
      kit.tokens.hashRefreshToken(a.refreshToken),
    );
  });

  it('succeeds silently for an unknown token', async () => {
    const kit = authTestKit();
    await expect(
      new LogoutUseCase(kit.refreshTokens, kit.tokens, kit.clock).execute({ refreshToken: 'nope' }),
    ).resolves.toBeUndefined();
  });
});
