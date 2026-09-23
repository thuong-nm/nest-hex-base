import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { UserStatus, UserStatusChangedEvent } from '#src/modules/users/index.js';
import { RevokeUserSessionsUseCase } from '../../application/use-cases/revoke-user-sessions.use-case.js';

/** Inbound adapter: reacts to the users module's event by calling an auth use case. */
@EventsHandler(UserStatusChangedEvent)
export class UserStatusChangedHandler implements IEventHandler<UserStatusChangedEvent> {
  private readonly logger = new Logger(UserStatusChangedHandler.name);

  constructor(private readonly revokeUserSessions: RevokeUserSessionsUseCase) {}

  async handle(event: UserStatusChangedEvent): Promise<void> {
    if (event.status !== UserStatus.DISABLED) return;
    try {
      await this.revokeUserSessions.execute(event.aggregateId);
    } catch (error) {
      // The status change is already committed; log loudly so the failure is visible.
      this.logger.error(
        { err: error, userId: event.aggregateId },
        'Failed to revoke sessions of disabled user',
      );
      throw error;
    }
  }
}
