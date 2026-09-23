import type { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';
import type { DomainEventPublisher } from '#src/shared/kernel/ports/domain-event-publisher.port.js';

export class RecordingEventPublisher implements DomainEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  ofType<T extends DomainEvent>(type: abstract new (...args: never[]) => T): T[] {
    return this.published.filter((event): event is T => event instanceof type);
  }
}
