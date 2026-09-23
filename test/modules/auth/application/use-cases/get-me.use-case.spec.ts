import { FakeUserAccounts } from '#test/fakes/auth/fake-user-account.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import { AuthErrorCode } from '#src/modules/auth/domain/errors/auth.errors.js';
import { GetMeUseCase } from '#src/modules/auth/application/use-cases/get-me.use-case.js';

describe('GetMeUseCase', () => {
  it('returns the current account', async () => {
    const accounts = new FakeUserAccounts();
    const account = accounts.add({ email: 'jane@example.com', password: 'x' });
    await expect(new GetMeUseCase(accounts).execute(account.id)).resolves.toEqual(account);
  });

  it('fails with COMMON.UNAUTHORIZED for a deleted user', async () => {
    await expect(new GetMeUseCase(new FakeUserAccounts()).execute('missing')).rejects.toMatchObject(
      {
        code: CommonErrorCode.UNAUTHORIZED,
      },
    );
  });

  it('fails with AUTH.ACCOUNT_DISABLED for a disabled user', async () => {
    const accounts = new FakeUserAccounts();
    const account = accounts.add({ email: 'jane@example.com', password: 'x', status: 'DISABLED' });
    await expect(new GetMeUseCase(accounts).execute(account.id)).rejects.toMatchObject({
      code: AuthErrorCode.ACCOUNT_DISABLED,
    });
  });
});
