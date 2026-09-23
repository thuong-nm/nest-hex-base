/**
 * Base class for domain events. Events are plain classes so the domain stays framework-free;
 * `@nestjs/cqrs` handlers subscribe by class, so each event must be its own subclass.
 */
export abstract class DomainEvent {
  protected constructor(
    readonly aggregateId: string,
    readonly occurredAt: Date,
  ) {}
}
