import { normalizeSearch } from '#src/shared/kernel/list-query.js';
import type { ListUsersCommand } from '../dto/list-users.command.js';
import { toUserResult, type UserListResult } from '../dto/user.result.js';
import type { UserRepository } from '../ports/user.repository.port.js';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(command: ListUsersCommand): Promise<UserListResult> {
    const { items, total } = await this.users.list({
      ...command,
      search: normalizeSearch(command.search),
    });
    return { items: items.map(toUserResult), total, page: command.page, limit: command.limit };
  }
}
