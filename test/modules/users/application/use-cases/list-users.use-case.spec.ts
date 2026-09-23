import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { ListUsersUseCase } from '#src/modules/users/application/use-cases/list-users.use-case.js';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    await users.add(aUser({ email: 'admin@example.com', role: 'ADMIN' }));
    await users.add(aUser({ email: 'alice@example.com' }));
    await users.add(aUser({ email: 'bob@example.com', status: 'DISABLED' }));
    useCase = new ListUsersUseCase(users);
  });

  it('paginates and reports the total', async () => {
    const result = await useCase.execute({ page: 2, limit: 2 });
    expect(result).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(result.items).toHaveLength(1);
  });

  it('filters by role, status and email search', async () => {
    expect((await useCase.execute({ page: 1, limit: 10, role: 'ADMIN' })).total).toBe(1);
    expect((await useCase.execute({ page: 1, limit: 10, status: 'DISABLED' })).total).toBe(1);
    const search = await useCase.execute({ page: 1, limit: 10, search: ' ALI ' });
    expect(search.items.map((u) => u.email)).toEqual(['alice@example.com']);
  });
});
