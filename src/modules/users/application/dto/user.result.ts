import type { User } from '../../domain/entities/user.entity.js';
import type { Role } from '../../domain/value-objects/role.vo.js';
import type { UserStatus } from '../../domain/value-objects/user-status.vo.js';

/** Read model returned by use cases and the facade. Never contains the password hash. */
export interface UserResult {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResult(user: User): UserResult {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export interface UserListResult {
  items: UserResult[];
  total: number;
  page: number;
  limit: number;
}
