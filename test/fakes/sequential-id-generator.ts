import type { IdGenerator } from '#src/shared/kernel/ports/id-generator.port.js';

/** Deterministic UUID-shaped ids: ...000000000001, ...000000000002, ... */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `00000000-0000-4000-8000-${this.counter.toString().padStart(12, '0')}`;
  }
}
