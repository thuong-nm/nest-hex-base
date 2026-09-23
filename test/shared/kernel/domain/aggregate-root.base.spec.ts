import { AggregateRoot } from '#src/shared/kernel/domain/aggregate-root.base.js';
import { DomainEvent } from '#src/shared/kernel/domain/domain-event.base.js';

class Happened extends DomainEvent {
  constructor(id: string) {
    super(id, new Date(0));
  }
}
class Thing extends AggregateRoot {
  constructor(id: string) {
    super(id);
  }
  touch(): void {
    this.addEvent(new Happened(this.id));
  }
}

describe('AggregateRoot', () => {
  it('pullEvents returns pending events once', () => {
    const thing = new Thing('1');
    thing.touch();
    expect(thing.pullEvents()).toHaveLength(1);
    expect(thing.pullEvents()).toHaveLength(0);
  });
});
