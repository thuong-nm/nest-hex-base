import { toPrismaListArgs } from '#src/shared/infrastructure/database/prisma-list-args.js';
import { DEFAULT_LIST_QUERY } from '#src/shared/kernel/list-query.js';

describe('toPrismaListArgs', () => {
  const columns = { createdAt: 'created_on', updatedAt: 'updated_on', fullName: 'name' } as const;

  it('orders by the column mapped from the API sort key, with id as tiebreaker', () => {
    const args = toPrismaListArgs(
      { ...DEFAULT_LIST_QUERY, page: 3, limit: 10, sortBy: 'fullName', sortOrder: 'asc' },
      columns,
    );
    expect(args).toEqual({ skip: 20, take: 10, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
  });

  it('uses the defaults: newest created first', () => {
    expect(toPrismaListArgs(DEFAULT_LIST_QUERY, columns).orderBy).toEqual([
      { created_on: 'desc' },
      { id: 'asc' },
    ]);
  });
});
