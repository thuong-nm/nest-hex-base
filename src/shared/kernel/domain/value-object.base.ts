type Primitive = string | number | boolean | bigint | null | undefined | Date;

export abstract class ValueObject<TProps extends Record<string, Primitive>> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (other === undefined || other.constructor !== this.constructor) return false;
    const keys = Object.keys(this.props);
    return keys.every((key) => {
      const a = this.props[key];
      const b = other.props[key];
      return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;
    });
  }
}
