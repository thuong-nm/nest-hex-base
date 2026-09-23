import { authTestKit, REFRESH_TTL_SECONDS } from '#test/fakes/auth/auth-test-kit.js';
import { AuthErrorCode } from '#src/modules/auth/domain/errors/auth.errors.js';
import { LoginUseCase } from '#src/modules/auth/application/use-cases/login.use-case.js';
import { RefreshSessionUseCase } from '#src/modules/auth/application/use-cases/refresh-session.use-case.js';

describe('RefreshSessionUseCase', () => {
  let kit: ReturnType<typeof authTestKit>;
  let login: LoginUseCase;
  let refresh: RefreshSessionUseCase;
  let accountId: string;

  beforeEach(() => {
    kit = authTestKit();
    login = new LoginUseCase(kit.accounts, kit.refreshTokens, kit.sessions, kit.clock);
    refresh = new RefreshSessionUseCase(
      kit.accounts,
      kit.refreshTokens,
      kit.tokens,
      kit.sessions,
      kit.transactions,
      kit.clock,
    );
    accountId = kit.accounts.add({ email: 'jane@example.com', password: 'Password123' }).id;
  });

  const signIn = () => login.execute({ email: 'jane@example.com', password: 'Password123' });

  it('rotates: returns a new refresh token and revokes the old one, in one transaction', async () => {
    const first = await signIn();

    const second = await refresh.execute({ refreshToken: first.refreshToken });

    expect(second.refreshToken).not.toBe(first.refreshToken);
    const [old, next] = kit.refreshTokens.all();
    expect(old?.isRevoked).toBe(true);
    expect(old?.replacedBy).toBe(next?.id);
    expect(next?.familyId).toBe(old?.familyId);
    expect(next?.isRevoked).toBe(false);
    expect(kit.transactions.runs).toBe(1);
  });

  it('on reuse of a rotated token, revokes the whole family', async () => {
    const first = await signIn();
    const second = await refresh.execute({ refreshToken: first.refreshToken });

    await expect(refresh.execute({ refreshToken: first.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.REFRESH_TOKEN_REUSED,
    });
    expect(kit.refreshTokens.all().every((t) => t.isRevoked)).toBe(true);
    await expect(refresh.execute({ refreshToken: second.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.REFRESH_TOKEN_REUSED,
    });
  });

  it('does not touch other families of the same user', async () => {
    const deviceA = await signIn();
    const deviceB = await signIn();
    await refresh.execute({ refreshToken: deviceA.refreshToken });
    await expect(refresh.execute({ refreshToken: deviceA.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.REFRESH_TOKEN_REUSED,
    });

    await expect(refresh.execute({ refreshToken: deviceB.refreshToken })).resolves.toBeDefined();
  });

  it('rejects an unknown token', async () => {
    await expect(refresh.execute({ refreshToken: 'nope' })).rejects.toMatchObject({
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  });

  it('rejects an expired token', async () => {
    const first = await signIn();
    kit.clock.advance(REFRESH_TTL_SECONDS * 1000);
    await expect(refresh.execute({ refreshToken: first.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  });

  it('refuses a disabled user and revokes the family', async () => {
    const first = await signIn();
    kit.accounts.setStatus(accountId, 'DISABLED');

    await expect(refresh.execute({ refreshToken: first.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.ACCOUNT_DISABLED,
    });
    expect(kit.refreshTokens.all().every((t) => t.isRevoked)).toBe(true);
  });

  it('treats losing a concurrent rotation race as reuse', async () => {
    const first = await signIn();
    const [stored] = kit.refreshTokens.all();
    // Simulate another request revoking the token between our read and our conditional update.
    const original = kit.refreshTokens.findByHash.bind(kit.refreshTokens);
    kit.refreshTokens.findByHash = async (hash) => {
      const token = await original(hash);
      if (stored) await kit.refreshTokens.revokeFamily(stored.familyId, kit.clock.now());
      return token;
    };

    await expect(refresh.execute({ refreshToken: first.refreshToken })).rejects.toMatchObject({
      code: AuthErrorCode.REFRESH_TOKEN_REUSED,
    });
    expect(kit.refreshTokens.all()).toHaveLength(1);
  });
});
