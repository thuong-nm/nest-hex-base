import type { Clock } from '#src/shared/kernel/ports/clock.port.js';
import type { DomainEventPublisher } from '#src/shared/kernel/ports/domain-event-publisher.port.js';
import type { IdGenerator } from '#src/shared/kernel/ports/id-generator.port.js';
import { unwrap } from '#src/shared/kernel/result.js';
import { User } from '../../domain/entities/user.entity.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { Role } from '../../domain/value-objects/role.vo.js';
import type { EnsureAdminCommand, EnsureAdminResult } from '../dto/ensure-admin.command.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { UserRepository } from '../ports/user.repository.port.js';

/**
 * Idempotent bootstrap for the first admin (pnpm seed:admin). An existing user with that email is
 * promoted to an active ADMIN; their password is left untouched.
 */
export class EnsureAdminUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: EnsureAdminCommand): Promise<EnsureAdminResult> {
    const email = unwrap(Email.create(command.email));
    const now = this.clock.now();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      existing.promoteToActiveAdmin(now);
      const events = existing.pullEvents();
      if (events.length > 0) {
        await this.users.update(existing);
        await this.events.publish(events);
      }
      return { created: false, userId: existing.id };
    }

    const user = User.register({
      id: this.ids.generate(),
      email,
      name: command.name,
      passwordHash: await this.hasher.hash(command.password),
      role: Role.ADMIN,
      now,
    });
    await this.users.create(user);
    await this.events.publish(user.pullEvents());
    return { created: true, userId: user.id };
  }
}
