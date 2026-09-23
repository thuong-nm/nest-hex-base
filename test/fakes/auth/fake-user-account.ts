import type {
  UserAccount,
  UserAccountPort,
} from '#src/modules/auth/application/ports/user-account.port.js';

interface StoredAccount extends UserAccount {
  password: string;
}

/** In-memory stand-in for the users facade, from auth's point of view. */
export class FakeUserAccounts implements UserAccountPort {
  private readonly accounts = new Map<string, StoredAccount>();
  private counter = 0;

  add(account: Partial<StoredAccount> & { email: string; password: string }): UserAccount {
    this.counter += 1;
    const stored: StoredAccount = {
      id: `20000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`,
      name: 'Test',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...account,
    };
    this.accounts.set(stored.id, stored);
    return strip(stored);
  }

  setStatus(id: string, status: UserAccount['status']): void {
    const account = this.accounts.get(id);
    if (account) account.status = status;
  }

  async register(input: { email: string; name: string; password: string }): Promise<UserAccount> {
    return this.add({ ...input, role: 'USER' });
  }

  async verifyCredentials(input: { email: string; password: string }): Promise<UserAccount | null> {
    const account = [...this.accounts.values()].find((a) => a.email === input.email);
    return account && account.password === input.password ? strip(account) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const account = this.accounts.get(id);
    return account ? strip(account) : null;
  }
}

function strip({ password: _password, ...account }: StoredAccount): UserAccount {
  return account;
}
