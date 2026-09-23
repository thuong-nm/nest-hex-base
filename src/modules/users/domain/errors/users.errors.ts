import { DomainError } from '#src/shared/kernel/errors/domain.error.js';

export const UsersErrorCode = {
  EMAIL_TAKEN: 'USERS.EMAIL_TAKEN',
  NOT_FOUND: 'USERS.NOT_FOUND',
  INVALID_EMAIL: 'USERS.INVALID_EMAIL',
  INVALID_NAME: 'USERS.INVALID_NAME',
  CANNOT_MODIFY_SELF: 'USERS.CANNOT_MODIFY_SELF',
} as const;

export const UsersErrors = {
  emailTaken: () => new DomainError(UsersErrorCode.EMAIL_TAKEN, { kind: 'CONFLICT' }),
  notFound: () => new DomainError(UsersErrorCode.NOT_FOUND, { kind: 'NOT_FOUND' }),
  invalidEmail: () => new DomainError(UsersErrorCode.INVALID_EMAIL, { kind: 'VALIDATION' }),
  invalidName: () => new DomainError(UsersErrorCode.INVALID_NAME, { kind: 'VALIDATION' }),
  cannotModifySelf: () => new DomainError(UsersErrorCode.CANNOT_MODIFY_SELF, { kind: 'FORBIDDEN' }),
};
