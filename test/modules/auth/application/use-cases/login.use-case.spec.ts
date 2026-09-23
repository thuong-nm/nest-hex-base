import { authTestKit } from '#test/fakes/auth/auth-test-kit.js';
import { AuthErrorCode } from '#src/modules/auth/domain/errors/auth.errors.js';
import { LoginUseCase } from '#src/modules/auth/application/use-cases/login.use-case.js';

describe('LoginUseCase', () => {
  let kit: ReturnType<typeof authTestKit>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    kit = authTestKit();
    useCase = new LoginUseCase(kit.accounts, kit.refreshTokens, kit.sessions, kit.clock);
  });

  it('returns an access token and a stored, hashed refresh token', async () => {
    const account = kit.accounts.add({ email: 'jane@example.com', password: 'Password123' });

    const session = await useCase.execute({ email: 'jane@example.com', password: 'Password123' });

    expect(session.accessToken).toBe(`access:${account.id}:USER`);
    const [stored] = kit.refreshTokens.all();
    expect(stored?.tokenHash).toBe(kit.tokens.hashRefreshToken(session.refreshToken));
    expect(stored?.tokenHash).not.toBe(session.refreshToken);
    expect(stored?.userId).toBe(account.id);
  });

  it.each([
    ['unknown email', 'ghost@example.com', 'Password123'],
    ['wrong password', 'jane@example.com', 'wrong'],
  ])('fails with the same generic error for %s', async (_case, email, password) => {
    kit.accounts.add({ email: 'jane@example.com', password: 'Password123' });
    await expect(useCase.execute({ email, password })).rejects.toMatchObject({
      code: AuthErrorCode.INVALID_CREDENTIALS,
      kind: 'UNAUTHORIZED',
    });
  });

  it('refuses a disabled account', async () => {
    kit.accounts.add({ email: 'jane@example.com', password: 'Password123', status: 'DISABLED' });
    await expect(
      useCase.execute({ email: 'jane@example.com', password: 'Password123' }),
    ).rejects.toMatchObject({ code: AuthErrorCode.ACCOUNT_DISABLED });
    expect(kit.refreshTokens.all()).toHaveLength(0);
  });
});
