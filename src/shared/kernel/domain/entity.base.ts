export abstract class Entity<TId extends string = string> {
  protected constructor(readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    return other !== undefined && other.constructor === this.constructor && other.id === this.id;
  }
}
