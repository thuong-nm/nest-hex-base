import type { DomainEvent } from '../domain/domain-event.base.js';

/** Publishes events after the aggregate that raised them has been persisted. */
export interface DomainEventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>;
}

export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');
