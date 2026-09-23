import { FakePasswordHasher } from '#test/fakes/users/fake-password-hasher.js';
import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { VerifyCredentialsUseCase } from '#src/modules/users/application/use-cases/verify-credentials.use-case.js';

describe('VerifyCredentialsUseCase', () => {
  let users: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let useCase: VerifyCredentialsUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    useCase = new VerifyCredentialsUseCase(users, hasher);
    await users.add(aUser({ email: 'jane@example.com', password: 'Password123' }));
  });

  it('returns the user when email and password match', async () => {
    const result = await useCase.execute({ email: 'JANE@example.com', password: 'Password123' });
    expect(result?.email).toBe('jane@example.com');
  });

  it('returns null for a wrong password', async () => {
    expect(await useCase.execute({ email: 'jane@example.com', password: 'nope' })).toBeNull();
  });

  it('returns null for an unknown email and still runs the hasher (timing equalization)', async () => {
    expect(await useCase.execute({ email: 'ghost@example.com', password: 'x' })).toBeNull();
    expect(hasher.verifyCalls).toBe(1);
  });

  it('returns null for a malformed email without throwing', async () => {
    expect(await useCase.execute({ email: 'garbage', password: 'x' })).toBeNull();
  });
});
