import type { DomainEvent } from './domain-event.base.js';
import { Entity } from './entity.base.js';

export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  #events: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this.#events.push(event);
  }

  /** Returns and clears the pending events. Call after the aggregate has been persisted. */
  pullEvents(): DomainEvent[] {
    const events = this.#events;
    this.#events = [];
    return events;
  }
}
