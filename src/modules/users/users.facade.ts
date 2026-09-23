import { Injectable } from '@nestjs/common';
import type {
  EnsureAdminCommand,
  EnsureAdminResult,
} from './application/dto/ensure-admin.command.js';
import type { RegisterUserCommand } from './application/dto/register-user.command.js';
import type { UserResult } from './application/dto/user.result.js';
import type { VerifyCredentialsCommand } from './application/dto/verify-credentials.command.js';
import { EnsureAdminUseCase } from './application/use-cases/ensure-admin.use-case.js';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { VerifyCredentialsUseCase } from './application/use-cases/verify-credentials.use-case.js';

/**
 * The users module's public API for other modules. Keep it small and stable: other modules call
 * it through their own ports, so every method here is a contract.
 */
@Injectable()
export class UsersFacade {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly verifyCredentialsUseCase: VerifyCredentialsUseCase,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly ensureAdminUseCase: EnsureAdminUseCase,
  ) {}

  register(command: RegisterUserCommand): Promise<UserResult> {
    return this.registerUser.execute(command);
  }

  verifyCredentials(command: VerifyCredentialsCommand): Promise<UserResult | null> {
    return this.verifyCredentialsUseCase.execute(command);
  }

  findById(id: string): Promise<UserResult | null> {
    return this.findUserById.execute(id);
  }

  ensureAdmin(command: EnsureAdminCommand): Promise<EnsureAdminResult> {
    return this.ensureAdminUseCase.execute(command);
  }
}
