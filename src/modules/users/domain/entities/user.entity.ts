import { AggregateRoot } from '#src/shared/kernel/domain/aggregate-root.base.js';
import { UsersErrors } from '../errors/users.errors.js';
import { UserRegisteredEvent } from '../events/user-registered.event.js';
import { UserRoleChangedEvent } from '../events/user-role-changed.event.js';
import { UserStatusChangedEvent } from '../events/user-status-changed.event.js';
import type { Email } from '../value-objects/email.vo.js';
import { Role } from '../value-objects/role.vo.js';
import { UserStatus } from '../value-objects/user-status.vo.js';

export interface UserProps {
  email: Email;
  name: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserProps {
  id: string;
  email: Email;
  name: string;
  passwordHash: string;
  now: Date;
  /** Only trusted internal callers (the admin seed) pass this; public registration never does. */
  role?: Role;
}

const NAME_MAX_LENGTH = 100;

export class User extends AggregateRoot {
  private constructor(
    id: string,
    private props: UserProps,
  ) {
    super(id);
  }

  static register(input: RegisterUserProps): User {
    const name = input.name.trim();
    if (name.length === 0 || name.length > NAME_MAX_LENGTH) throw UsersErrors.invalidName();

    const user = new User(input.id, {
      email: input.email,
      name,
      passwordHash: input.passwordHash,
      role: input.role ?? Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: input.now,
      updatedAt: input.now,
    });
    user.addEvent(new UserRegisteredEvent(user.id, user.email.value, input.now));
    return user;
  }

  /** Rebuilds an existing user from persistence. Raises no events. */
  static restore(id: string, props: UserProps): User {
    return new User(id, { ...props });
  }

  get email(): Email {
    return this.props.email;
  }
  get name(): string {
    return this.props.name;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  /** `actorId` is the admin performing the change; admins cannot demote themselves. */
  changeRole(role: Role, actorId: string, now: Date): void {
    if (actorId === this.id) throw UsersErrors.cannotModifySelf();
    if (role === this.props.role) return;
    const previousRole = this.props.role;
    this.props = { ...this.props, role, updatedAt: now };
    this.addEvent(new UserRoleChangedEvent(this.id, previousRole, role, now));
  }

  /** `actorId` is the admin performing the change; admins cannot disable themselves. */
  changeStatus(status: UserStatus, actorId: string, now: Date): void {
    if (actorId === this.id) throw UsersErrors.cannotModifySelf();
    if (status === this.props.status) return;
    this.props = { ...this.props, status, updatedAt: now };
    this.addEvent(new UserStatusChangedEvent(this.id, status, now));
  }

  /** Used by the admin seed, which has no acting user. */
  promoteToActiveAdmin(now: Date): void {
    if (this.props.role !== Role.ADMIN) {
      const previousRole = this.props.role;
      this.props = { ...this.props, role: Role.ADMIN, updatedAt: now };
      this.addEvent(new UserRoleChangedEvent(this.id, previousRole, Role.ADMIN, now));
    }
    if (this.props.status !== UserStatus.ACTIVE) {
      this.props = { ...this.props, status: UserStatus.ACTIVE, updatedAt: now };
      this.addEvent(new UserStatusChangedEvent(this.id, UserStatus.ACTIVE, now));
    }
  }
}
