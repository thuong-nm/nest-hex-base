import { FixedClock } from '#test/fakes/fixed-clock.js';
import { RecordingEventPublisher } from '#test/fakes/recording-event-publisher.js';
import { SequentialIdGenerator } from '#test/fakes/sequential-id-generator.js';
import { FakePasswordHasher } from '#test/fakes/users/fake-password-hasher.js';
import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { EnsureAdminUseCase } from '#src/modules/users/application/use-cases/ensure-admin.use-case.js';

describe('EnsureAdminUseCase', () => {
  let users: InMemoryUserRepository;
  let useCase: EnsureAdminUseCase;
  const command = { email: 'admin@example.com', password: 'Admin12345', name: 'Admin' };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    useCase = new EnsureAdminUseCase(
      users,
      new FakePasswordHasher(),
      new SequentialIdGenerator(),
      new FixedClock(),
      new RecordingEventPublisher(),
    );
  });

  it('creates an active ADMIN when none exists', async () => {
    const result = await useCase.execute(command);
    expect(result.created).toBe(true);
    const admin = await users.findById(result.userId);
    expect(admin).toMatchObject({ role: 'ADMIN', status: 'ACTIVE' });
  });

  it('is idempotent', async () => {
    const first = await useCase.execute(command);
    const second = await useCase.execute(command);
    expect(second).toEqual({ created: false, userId: first.userId });
  });

  it('promotes and re-enables an existing user without touching the password', async () => {
    const existing = await users.add(
      aUser({ email: 'admin@example.com', password: 'Original123', status: 'DISABLED' }),
    );

    const result = await useCase.execute(command);

    expect(result).toEqual({ created: false, userId: existing.id });
    const admin = await users.findById(existing.id);
    expect(admin).toMatchObject({
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: 'hashed:Original123',
    });
  });
});
