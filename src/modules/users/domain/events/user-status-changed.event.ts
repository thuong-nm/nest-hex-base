import { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';
import type { UserStatus } from '../value-objects/user-status.vo.js';

export class UserStatusChangedEvent extends DomainEvent {
  constructor(
    userId: string,
    readonly status: UserStatus,
    occurredAt: Date,
  ) {
    super(userId, occurredAt);
  }
}
