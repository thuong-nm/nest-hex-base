import { FixedClock } from '#test/fakes/fixed-clock.js';
import { RecordingEventPublisher } from '#test/fakes/recording-event-publisher.js';
import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { UsersErrorCode } from '#src/modules/users/domain/errors/users.errors.js';
import { UserRoleChangedEvent } from '#src/modules/users/domain/events/user-role-changed.event.js';
import { ChangeUserRoleUseCase } from '#src/modules/users/application/use-cases/change-user-role.use-case.js';

describe('ChangeUserRoleUseCase', () => {
  let users: InMemoryUserRepository;
  let events: RecordingEventPublisher;
  let useCase: ChangeUserRoleUseCase;
  const admin = aUser({ role: 'ADMIN' });

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    events = new RecordingEventPublisher();
    useCase = new ChangeUserRoleUseCase(users, new FixedClock(), events);
    await users.add(admin);
  });

  it('changes the role, persists it and publishes an event', async () => {
    const target = await users.add(aUser());

    const result = await useCase.execute({ actorId: admin.id, userId: target.id, role: 'ADMIN' });

    expect(result.role).toBe('ADMIN');
    expect((await users.findById(target.id))?.role).toBe('ADMIN');
    expect(events.ofType(UserRoleChangedEvent)).toEqual([
      expect.objectContaining({ aggregateId: target.id, previousRole: 'USER', role: 'ADMIN' }),
    ]);
  });

  it('is a no-op without an event when the role is unchanged', async () => {
    const target = await users.add(aUser());
    await useCase.execute({ actorId: admin.id, userId: target.id, role: 'USER' });
    expect(events.published).toHaveLength(0);
  });

  it('forbids an admin from changing their own role', async () => {
    await expect(
      useCase.execute({ actorId: admin.id, userId: admin.id, role: 'USER' }),
    ).rejects.toMatchObject({ code: UsersErrorCode.CANNOT_MODIFY_SELF, kind: 'FORBIDDEN' });
    expect((await users.findById(admin.id))?.role).toBe('ADMIN');
  });

  it('fails with USERS.NOT_FOUND for an unknown user', async () => {
    await expect(
      useCase.execute({
        actorId: admin.id,
        userId: '00000000-0000-4000-8000-999999999999',
        role: 'ADMIN',
      }),
    ).rejects.toMatchObject({ code: UsersErrorCode.NOT_FOUND, kind: 'NOT_FOUND' });
  });
});
