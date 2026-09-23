/**
 * Transport-agnostic failure category. The HTTP layer maps it to a status code; the domain
 * only states *what kind* of failure happened.
 */
export type DomainErrorKind =
  'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'BUSINESS_RULE';

export interface DomainErrorOptions {
  kind?: DomainErrorKind;
  params?: Record<string, unknown>;
}

/**
 * The only error domain and application code may throw. It carries a stable `code`
 * (`<CONTEXT>.<SCREAMING_SNAKE>`) and never a user-facing message: the interface layer
 * translates `code` using `params` for interpolation.
 */
export class DomainError extends Error {
  readonly code: string;
  readonly kind: DomainErrorKind;
  readonly params?: Record<string, unknown>;

  constructor(code: string, options: DomainErrorOptions = {}) {
    super(code);
    this.name = 'DomainError';
    this.code = code;
    this.kind = options.kind ?? 'BUSINESS_RULE';
    this.params = options.params;
  }
}
