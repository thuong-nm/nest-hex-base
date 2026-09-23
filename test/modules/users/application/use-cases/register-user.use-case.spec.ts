import { FixedClock } from '#test/fakes/fixed-clock.js';
import { RecordingEventPublisher } from '#test/fakes/recording-event-publisher.js';
import { SequentialIdGenerator } from '#test/fakes/sequential-id-generator.js';
import { FakePasswordHasher } from '#test/fakes/users/fake-password-hasher.js';
import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { UsersErrorCode } from '#src/modules/users/domain/errors/users.errors.js';
import { UserRegisteredEvent } from '#src/modules/users/domain/events/user-registered.event.js';
import { RegisterUserUseCase } from '#src/modules/users/application/use-cases/register-user.use-case.js';

describe('RegisterUserUseCase', () => {
  let users: InMemoryUserRepository;
  let events: RecordingEventPublisher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    events = new RecordingEventPublisher();
    useCase = new RegisterUserUseCase(
      users,
      new FakePasswordHasher(),
      new SequentialIdGenerator(),
      new FixedClock(),
      events,
    );
  });

  it('creates an ACTIVE USER with a normalized email and hashed password', async () => {
    const result = await useCase.execute({
      email: '  Jane@Example.COM ',
      name: ' Jane ',
      password: 'Password123',
    });

    expect(result).toMatchObject({
      email: 'jane@example.com',
      name: 'Jane',
      role: 'USER',
      status: 'ACTIVE',
    });
    expect(result).not.toHaveProperty('passwordHash');
    const stored = await users.findById(result.id);
    expect(stored?.passwordHash).toBe('hashed:Password123');
  });

  it('publishes UserRegisteredEvent', async () => {
    const result = await useCase.execute({
      email: 'a@example.com',
      name: 'A',
      password: 'Password123',
    });

    expect(events.ofType(UserRegisteredEvent)).toEqual([
      expect.objectContaining({ aggregateId: result.id, email: 'a@example.com' }),
    ]);
  });

  it('rejects an email that is already registered, case-insensitively', async () => {
    await users.add(aUser({ email: 'taken@example.com' }));

    await expect(
      useCase.execute({ email: 'TAKEN@example.com', name: 'B', password: 'Password123' }),
    ).rejects.toMatchObject({ code: UsersErrorCode.EMAIL_TAKEN, kind: 'CONFLICT' });
  });

  it('rejects an invalid email', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', name: 'B', password: 'Password123' }),
    ).rejects.toMatchObject({ code: UsersErrorCode.INVALID_EMAIL });
  });

  it('rejects a blank name', async () => {
    await expect(
      useCase.execute({ email: 'b@example.com', name: '   ', password: 'Password123' }),
    ).rejects.toMatchObject({ code: UsersErrorCode.INVALID_NAME });
  });
});
