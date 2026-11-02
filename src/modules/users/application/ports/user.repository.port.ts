import { type ListQuery, sortFields } from '#src/shared/kernel/list-query.js';
import type { User } from '../../domain/entities/user.entity.js';
import type { Email } from '../../domain/value-objects/email.vo.js';
import type { Role } from '../../domain/value-objects/role.vo.js';
import type { UserStatus } from '../../domain/value-objects/user-status.vo.js';

/** Sort keys as the API names them (fields of the user response); the repository maps them to columns. */
export const USER_SORT_FIELDS = sortFields('email', 'name');

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

/** `search` is a case-insensitive substring match on email. */
export interface UserListCriteria extends ListQuery<UserSortField> {
  role?: Role;
  status?: UserStatus;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  /** Throws `USERS.EMAIL_TAKEN` if the email is already used (also under a race). */
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  list(criteria: UserListCriteria): Promise<{ items: User[]; total: number }>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
