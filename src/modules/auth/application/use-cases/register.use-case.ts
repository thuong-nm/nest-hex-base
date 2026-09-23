import type { AccountResult } from '../dto/account.result.js';
import type { RegisterCommand } from '../dto/register.command.js';
import type { UserAccountPort } from '../ports/user-account.port.js';

/** Creates the account only; the client logs in afterwards to obtain tokens. */
export class RegisterUseCase {
  constructor(private readonly accounts: UserAccountPort) {}

  execute(command: RegisterCommand): Promise<AccountResult> {
    return this.accounts.register({
      email: command.email,
      name: command.name,
      password: command.password,
    });
  }
}
