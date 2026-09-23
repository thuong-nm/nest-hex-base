import { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';
import type { Role } from '../value-objects/role.vo.js';

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    userId: string,
    readonly previousRole: Role,
    readonly role: Role,
    occurredAt: Date,
  ) {
    super(userId, occurredAt);
  }
}
