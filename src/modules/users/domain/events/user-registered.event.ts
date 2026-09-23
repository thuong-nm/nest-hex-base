import { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    userId: string,
    readonly email: string,
    occurredAt: Date,
  ) {
    super(userId, occurredAt);
  }
}
