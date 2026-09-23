import type { Prisma, User as PrismaUser } from '#src/generated/prisma/client.js';
import { User } from '../../domain/entities/user.entity.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { unwrap } from '#src/shared/kernel/result.js';

export const UserMapper = {
  toDomain(row: PrismaUser): User {
    return User.restore(row.id, {
      email: unwrap(Email.create(row.email)),
      name: row.name,
      passwordHash: row.passwordHash,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email.value,
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
