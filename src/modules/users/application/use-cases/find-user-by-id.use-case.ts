import { toUserResult, type UserResult } from '../dto/user.result.js';
import type { UserRepository } from '../ports/user.repository.port.js';

export class FindUserByIdUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: string): Promise<UserResult | null> {
    const user = await this.users.findById(id);
    return user ? toUserResult(user) : null;
  }
}
