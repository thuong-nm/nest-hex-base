import { InMemoryUserRepository } from '#test/fakes/users/in-memory-user.repository.js';
import { aUser } from '#test/fakes/users/user.factory.js';
import { FindUserByIdUseCase } from '#src/modules/users/application/use-cases/find-user-by-id.use-case.js';

describe('FindUserByIdUseCase', () => {
  it('returns the user or null', async () => {
    const users = new InMemoryUserRepository();
    const user = await users.add(aUser());
    const useCase = new FindUserByIdUseCase(users);

    expect((await useCase.execute(user.id))?.id).toBe(user.id);
    expect(await useCase.execute('00000000-0000-4000-8000-999999999999')).toBeNull();
  });
});
