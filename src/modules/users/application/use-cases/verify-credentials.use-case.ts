import { Email } from '../../domain/value-objects/email.vo.js';
import type { VerifyCredentialsCommand } from '../dto/verify-credentials.command.js';
import { toUserResult, type UserResult } from '../dto/user.result.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { UserRepository } from '../ports/user.repository.port.js';

/**
 * Returns the user when email and password match, otherwise null. It does not say which one was
 * wrong, and does not check status: the caller decides what a disabled account means.
 */
export class VerifyCredentialsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: VerifyCredentialsCommand): Promise<UserResult | null> {
    const email = Email.create(command.email);
    const user = email.ok ? await this.users.findByEmail(email.value) : null;
    const matches = await this.hasher.verify(user?.passwordHash ?? null, command.password);
    return user && matches ? toUserResult(user) : null;
  }
}
