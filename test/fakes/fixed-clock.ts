import type { Clock } from '#src/shared/kernel/ports/clock.port.js';

export class FixedClock implements Clock {
  constructor(private current = new Date('2026-01-01T00:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
