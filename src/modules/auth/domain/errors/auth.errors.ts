import { DomainError } from '#src/shared/kernel/errors/domain.error.js';

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
  INVALID_REFRESH_TOKEN: 'AUTH.INVALID_REFRESH_TOKEN',
  REFRESH_TOKEN_REUSED: 'AUTH.REFRESH_TOKEN_REUSED',
  ACCOUNT_DISABLED: 'AUTH.ACCOUNT_DISABLED',
} as const;

export const AuthErrors = {
  /** Deliberately the same for "no such email" and "wrong password". */
  invalidCredentials: () =>
    new DomainError(AuthErrorCode.INVALID_CREDENTIALS, { kind: 'UNAUTHORIZED' }),
  invalidRefreshToken: () =>
    new DomainError(AuthErrorCode.INVALID_REFRESH_TOKEN, { kind: 'UNAUTHORIZED' }),
  refreshTokenReused: () =>
    new DomainError(AuthErrorCode.REFRESH_TOKEN_REUSED, { kind: 'UNAUTHORIZED' }),
  accountDisabled: () => new DomainError(AuthErrorCode.ACCOUNT_DISABLED, { kind: 'FORBIDDEN' }),
};
