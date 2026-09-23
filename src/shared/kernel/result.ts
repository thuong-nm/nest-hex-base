import type { DomainError } from './errors/domain.error.js';

/**
 * For expected failures the caller handles locally (e.g. parsing a value object).
 * To abort a use case, throw a DomainError instead of threading a Result upward.
 */
export type Result<T, E = DomainError> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/** Returns the value or throws the error. Use at the boundary where a failure must abort. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
