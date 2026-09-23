import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
export declare class FixedClock implements Clock {
  private current;
  constructor(current?: Date);
  now(): Date;
  advance(ms: number): void;
}
