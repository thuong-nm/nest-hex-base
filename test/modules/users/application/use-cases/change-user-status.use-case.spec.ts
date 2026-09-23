import { FixedClock } from '#test/fakes/fixed-clock.js';
import { RecordingEventPublisher } from '#test/fakes/recording-event-publisher.js';
import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { UsersErrorCode } from '#src/modules/users/domain/errors/users.errors.js';
import { UserStatusChangedEvent } from '#src/modules/users/domain/events/user-status-changed.event.js';
import { ChangeUserStatusUseCase } from '#src/modules/users/application/use-cases/change-user-status.use-case.js';

describe('ChangeUserStatusUseCase', () => {
  let users: InMemoryUserRepository;
  let events: RecordingEventPublisher;
  let useCase: ChangeUserStatusUseCase;
  const admin = aUser({ role: 'ADMIN' });

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    events = new RecordingEventPublisher();
    useCase = new ChangeUserStatusUseCase(users, new FixedClock(), events);
    await users.add(admin);
  });

  it('disables a user and publishes UserStatusChangedEvent', async () => {
    const target = await users.add(aUser());

    const result = await useCase.execute({
      actorId: admin.id,
      userId: target.id,
      status: 'DISABLED',
    });

    expect(result.status).toBe('DISABLED');
    expect((await users.findById(target.id))?.status).toBe('DISABLED');
    expect(events.ofType(UserStatusChangedEvent)).toEqual([
      expect.objectContaining({ aggregateId: target.id, status: 'DISABLED' }),
    ]);
  });

  it('forbids an admin from disabling themselves', async () => {
    await expect(
      useCase.execute({ actorId: admin.id, userId: admin.id, status: 'DISABLED' }),
    ).rejects.toMatchObject({ code: UsersErrorCode.CANNOT_MODIFY_SELF });
    expect((await users.findById(admin.id))?.status).toBe('ACTIVE');
  });
});
