import { DomainError } from '#src/shared/kernel/errors/domain.error.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import { AuthErrors } from '../../domain/errors/auth.errors.js';
import type { AccountResult } from '../dto/account.result.js';
import type { UserAccountPort } from '../ports/user-account.port.js';

export class GetMeUseCase {
  constructor(private readonly accounts: UserAccountPort) {}

  async execute(userId: string): Promise<AccountResult> {
    const account = await this.accounts.findById(userId);
    // A valid token for a deleted user: treat as unauthenticated rather than "not found".
    if (!account) throw new DomainError(CommonErrorCode.UNAUTHORIZED, { kind: 'UNAUTHORIZED' });
    if (account.status !== 'ACTIVE') throw AuthErrors.accountDisabled();
    return account;
  }
}
