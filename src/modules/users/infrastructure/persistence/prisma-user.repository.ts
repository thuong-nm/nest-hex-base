import { Injectable } from '@nestjs/common';
import type { Prisma } from '#src/generated/prisma/client.js';
import { isUniqueViolation } from '#src/shared/infrastructure/database/prisma-errors.js';
import { PrismaTransactionHost } from '#src/shared/infrastructure/database/transaction.js';
import type { User } from '../../domain/entities/user.entity.js';
import { UsersErrors } from '../../domain/errors/users.errors.js';
import type { Email } from '../../domain/value-objects/email.vo.js';
import type {
  UserListCriteria,
  UserRepository,
} from '../../application/ports/user.repository.port.js';
import { UserMapper } from './user.mapper.js';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaTransactionHost) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.client.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db.client.user.findUnique({ where: { email: email.value } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async create(user: User): Promise<void> {
    try {
      await this.db.client.user.create({ data: UserMapper.toPersistence(user) });
    } catch (error) {
      // Two concurrent registrations can both pass the use case's pre-check.
      if (isUniqueViolation(error, 'email')) throw UsersErrors.emailTaken();
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    const { id: _id, createdAt: _createdAt, ...data } = UserMapper.toPersistence(user);
    await this.db.client.user.update({ where: { id: user.id }, data });
  }

  async list(criteria: UserListCriteria): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      role: criteria.role,
      status: criteria.status,
      email: criteria.search ? { contains: criteria.search, mode: 'insensitive' } : undefined,
    };
    const [rows, total] = await Promise.all([
      this.db.client.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (criteria.page - 1) * criteria.limit,
        take: criteria.limit,
      }),
      this.db.client.user.count({ where }),
    ]);
    return { items: rows.map((row) => UserMapper.toDomain(row)), total };
  }
}
