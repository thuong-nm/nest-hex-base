import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { DomainEventPublisher } from '#src/shared/kernel/ports/domain-event-publisher.port.js';
import { UsersErrors } from '../../domain/errors/users.errors.js';
import type { ChangeUserStatusCommand } from '../dto/change-user-status.command.js';
import { toUserResult, type UserResult } from '../dto/user.result.js';
import type { UserRepository } from '../ports/user.repository.port.js';

/** Disabling a user publishes UserStatusChangedEvent; the auth module revokes their sessions. */
export class ChangeUserStatusUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: ChangeUserStatusCommand): Promise<UserResult> {
    const user = await this.users.findById(command.userId);
    if (!user) throw UsersErrors.notFound();

    user.changeStatus(command.status, command.actorId, this.clock.now());
    const events = user.pullEvents();
    if (events.length > 0) {
      await this.users.update(user);
      await this.events.publish(events);
    }
    return toUserResult(user);
  }
}
