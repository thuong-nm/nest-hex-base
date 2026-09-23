import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '#src/shared/kernel/ports/id-generator.port.js';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
