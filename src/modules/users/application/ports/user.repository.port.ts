import type { User } from '../../domain/entities/user.entity.js';
import type { Email } from '../../domain/value-objects/email.vo.js';
import type { Role } from '../../domain/value-objects/role.vo.js';
import type { UserStatus } from '../../domain/value-objects/user-status.vo.js';

export interface UserListCriteria {
  page: number;
  limit: number;
  role?: Role;
  status?: UserStatus;
  /** Case-insensitive substring match on email. */
  search?: string;
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
