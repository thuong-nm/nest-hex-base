import { User } from '#src/modules/users/domain/entities/user.entity.js';
import { Email } from '#src/modules/users/domain/value-objects/email.vo.js';
import { Role } from '#src/modules/users/domain/value-objects/role.vo.js';
import { UserStatus } from '#src/modules/users/domain/value-objects/user-status.vo.js';
import { unwrap } from '#src/shared/kernel/result.js';

let sequence = 0;

export function aUser(
  overrides: Partial<{
    id: string;
    email: string;
    name: string;
    password: string;
    role: Role;
    status: UserStatus;
  }> = {},
): User {
  sequence += 1;
  const now = new Date('2026-01-01T00:00:00.000Z');
  return User.restore(
    overrides.id ?? `10000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    {
      email: unwrap(Email.create(overrides.email ?? `user${sequence}@example.com`)),
      name: overrides.name ?? `User ${sequence}`,
      passwordHash: `hashed:${overrides.password ?? 'Password123'}`,
      role: overrides.role ?? Role.USER,
      status: overrides.status ?? UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
  );
}
