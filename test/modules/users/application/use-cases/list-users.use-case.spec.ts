import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import type { ListUsersCommand } from '#src/modules/users/application/dto/list-users.command.js';
import { ListUsersUseCase } from '#src/modules/users/application/use-cases/list-users.use-case.js';
import { DEFAULT_LIST_QUERY } from '#src/shared/kernel/list-query.js';

const day = (n: number) => new Date(`2026-01-0${n}T00:00:00.000Z`);

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    // Creation order: admin, alice, bob. Update order: alice, bob, admin. Name order: bob, alice, admin.
    await users.add(
      aUser({
        email: 'admin@example.com',
        name: 'Zoe',
        role: 'ADMIN',
        createdAt: day(1),
        updatedAt: day(6),
      }),
    );
    await users.add(
      aUser({ email: 'alice@example.com', name: 'Mia', createdAt: day(2), updatedAt: day(2) }),
    );
    await users.add(
      aUser({
        email: 'bob@example.com',
        name: 'Ann',
        status: 'DISABLED',
        createdAt: day(3),
        updatedAt: day(5),
      }),
    );
    useCase = new ListUsersUseCase(users);
  });

  const emails = async (query: Partial<ListUsersCommand>) =>
    (await useCase.execute({ ...DEFAULT_LIST_QUERY, ...query })).items.map((u) => u.email);

  it('paginates and reports the total', async () => {
    const result = await useCase.execute({ ...DEFAULT_LIST_QUERY, page: 2, limit: 2 });
    expect(result).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(result.items).toHaveLength(1);
  });

  it('filters by role, status and email search', async () => {
    expect((await useCase.execute({ ...DEFAULT_LIST_QUERY, role: 'ADMIN' })).total).toBe(1);
    expect((await useCase.execute({ ...DEFAULT_LIST_QUERY, status: 'DISABLED' })).total).toBe(1);
    expect(await emails({ search: ' ALI ' })).toEqual(['alice@example.com']);
  });

  it('treats a blank search as no search', async () => {
    expect((await useCase.execute({ ...DEFAULT_LIST_QUERY, search: '   ' })).total).toBe(3);
  });

  it('sorts by createdAt or updatedAt in either direction, newest first by default', async () => {
    expect(await emails({})).toEqual(['bob@example.com', 'alice@example.com', 'admin@example.com']);
    expect(await emails({ sortBy: 'createdAt', sortOrder: 'asc' })).toEqual([
      'admin@example.com',
      'alice@example.com',
      'bob@example.com',
    ]);
    expect(await emails({ sortBy: 'updatedAt', sortOrder: 'desc' })).toEqual([
      'admin@example.com',
      'bob@example.com',
      'alice@example.com',
    ]);
    expect(await emails({ sortBy: 'updatedAt', sortOrder: 'asc' })).toEqual([
      'alice@example.com',
      'bob@example.com',
      'admin@example.com',
    ]);
  });

  it("sorts by the module's own fields", async () => {
    expect(await emails({ sortBy: 'email', sortOrder: 'asc' })).toEqual([
      'admin@example.com',
      'alice@example.com',
      'bob@example.com',
    ]);
    expect(await emails({ sortBy: 'name', sortOrder: 'asc' })).toEqual([
      'bob@example.com',
      'alice@example.com',
      'admin@example.com',
    ]);
  });
});
