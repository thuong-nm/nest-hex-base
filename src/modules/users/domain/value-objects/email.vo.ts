import { ValueObject } from '#src/shared/kernel/domain/value-object.base.js';
import type { DomainError } from '#src/shared/kernel/errors/domain.error.js';
import { err, ok, type Result } from '#src/shared/kernel/result.js';
import { UsersErrors } from '../errors/users.errors.js';

// Deliberately loose: the request DTO does strict validation; this only guards the invariant.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

/** Stored lower-cased and trimmed, so lookups are case-insensitive. */
export class Email extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): Result<Email, DomainError> {
    const value = raw.trim().toLowerCase();
    if (value.length > MAX_LENGTH || !EMAIL_PATTERN.test(value))
      return err(UsersErrors.invalidEmail());
    return ok(new Email(value));
  }

  get value(): string {
    return this.props.value;
  }
}
