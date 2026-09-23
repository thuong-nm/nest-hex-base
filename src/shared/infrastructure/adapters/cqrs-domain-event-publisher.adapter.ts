import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';
import type { DomainEventPublisher } from '#src/shared/kernel/ports/domain-event-publisher.port.js';

/**
 * In-process delivery: handlers run after the publishing use case has committed, and a failing
 * handler does not roll it back. Swap for an outbox-backed adapter if you need guaranteed delivery.
 */
@Injectable()
export class CqrsDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    if (events.length > 0) this.eventBus.publishAll([...events]);
  }
}
