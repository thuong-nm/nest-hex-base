import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { DomainEventPublisher } from '#src/shared/kernel/ports/domain-event-publisher.port.js';
import type { IdGenerator } from '#src/shared/kernel/ports/id-generator.port.js';
import { unwrap } from '#src/shared/kernel/result.js';
import { User } from '../../domain/entities/user.entity.js';
import { UsersErrors } from '../../domain/errors/users.errors.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import type { RegisterUserCommand } from '../dto/register-user.command.js';
import { toUserResult, type UserResult } from '../dto/user.result.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { UserRepository } from '../ports/user.repository.port.js';

/** Public self-registration. The role is always USER; callers cannot choose it. */
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserResult> {
    const email = unwrap(Email.create(command.email));
    if (await this.users.findByEmail(email)) throw UsersErrors.emailTaken();

    const user = User.register({
      id: this.ids.generate(),
      email,
      name: command.name,
      passwordHash: await this.hasher.hash(command.password),
      now: this.clock.now(),
    });
    await this.users.create(user);
    await this.events.publish(user.pullEvents());
    return toUserResult(user);
  }
}
