import { ValueObject } from '#src/shared/kernel/domain/value-object.base.js';

class Money extends ValueObject<{ amount: number; currency: string }> {
  constructor(amount: number, currency: string) {
    super({ amount, currency });
  }
}
class Other extends ValueObject<{ amount: number; currency: string }> {
  constructor(amount: number, currency: string) {
    super({ amount, currency });
  }
}

describe('ValueObject', () => {
  it('compares by value and by type', () => {
    expect(new Money(1, 'EUR').equals(new Money(1, 'EUR'))).toBe(true);
    expect(new Money(1, 'EUR').equals(new Money(2, 'EUR'))).toBe(false);
    expect(new Money(1, 'EUR').equals(new Other(1, 'EUR'))).toBe(false);
  });
});
