import type { Clock } from '#src/shared/kernel/ports/clock.port.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
