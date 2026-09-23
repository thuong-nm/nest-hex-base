export class FixedClock {
  current;
  constructor(current = new Date('2026-01-01T00:00:00.000Z')) {
    this.current = current;
  }
  now() {
    return new Date(this.current);
  }
  advance(ms) {
    this.current = new Date(this.current.getTime() + ms);
  }
}
//# sourceMappingURL=fixed-clock.js.map
