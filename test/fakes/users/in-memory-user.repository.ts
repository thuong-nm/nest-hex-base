import type {
  UserListCriteria,
  UserRepository,
} from '#src/modules/users/application/ports/user.repository.port.js';
import { User } from '#src/modules/users/domain/entities/user.entity.js';
import { UsersErrors } from '#src/modules/users/domain/errors/users.errors.js';
import type { Email } from '#src/modules/users/domain/value-objects/email.vo.js';

/** Stores snapshots, like a real database, so tests cannot pass by mutating shared instances. */
export class InMemoryUserRepository implements UserRepository {
  private readonly rows = new Map<string, User>();

  private snapshot(user: User): User {
    return User.restore(user.id, {
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = this.rows.get(id);
    return user ? this.snapshot(user) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = [...this.rows.values()].find((u) => u.email.equals(email));
    return user ? this.snapshot(user) : null;
  }

  async create(user: User): Promise<void> {
    if ([...this.rows.values()].some((u) => u.email.equals(user.email))) {
      throw UsersErrors.emailTaken();
    }
    this.rows.set(user.id, this.snapshot(user));
  }

  async update(user: User): Promise<void> {
    this.rows.set(user.id, this.snapshot(user));
  }

  async list(criteria: UserListCriteria): Promise<{ items: User[]; total: number }> {
    const matching = [...this.rows.values()].filter(
      (u) =>
        (!criteria.role || u.role === criteria.role) &&
        (!criteria.status || u.status === criteria.status) &&
        (!criteria.search || u.email.value.includes(criteria.search.toLowerCase())),
    );
    const start = (criteria.page - 1) * criteria.limit;
    return {
      items: matching.slice(start, start + criteria.limit).map((u) => this.snapshot(u)),
      total: matching.length,
    };
  }

  /** Test helper: seed a user directly. */
  async add(user: User): Promise<User> {
    await this.create(user);
    return user;
  }
}
