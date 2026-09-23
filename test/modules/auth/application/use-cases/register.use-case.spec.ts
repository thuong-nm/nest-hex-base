import { FakeUserAccounts } from '#test/fakes/auth/fake-user-account.js';
import { RegisterUseCase } from '#src/modules/auth/application/use-cases/register.use-case.js';

describe('RegisterUseCase', () => {
  it('registers through the user account port and returns the account without secrets', async () => {
    const accounts = new FakeUserAccounts();
    const result = await new RegisterUseCase(accounts).execute({
      email: 'jane@example.com',
      name: 'Jane',
      password: 'Password123',
    });

    expect(result).toMatchObject({ email: 'jane@example.com', role: 'USER', status: 'ACTIVE' });
    expect(result).not.toHaveProperty('password');
  });
});
