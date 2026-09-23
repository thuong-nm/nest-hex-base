import { Injectable } from '@nestjs/common';
import { UsersFacade, type UserResult } from '#src/modules/users/index.js';
import type { UserAccount, UserAccountPort } from '../../application/ports/user-account.port.js';

/** Implements auth's UserAccountPort over the users module's public facade (rule 5). */
@Injectable()
export class UsersFacadeUserAccountAdapter implements UserAccountPort {
  constructor(private readonly users: UsersFacade) {}

  async register(input: { email: string; name: string; password: string }): Promise<UserAccount> {
    return toAccount(await this.users.register(input));
  }

  async verifyCredentials(input: { email: string; password: string }): Promise<UserAccount | null> {
    const user = await this.users.verifyCredentials(input);
    return user ? toAccount(user) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const user = await this.users.findById(id);
    return user ? toAccount(user) : null;
  }
}

function toAccount(user: UserResult): UserAccount {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}
