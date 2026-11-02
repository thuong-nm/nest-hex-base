import { type ListQuery, SortOrder } from '#src/shared/kernel/list-query.js';

type OrderBy<TField extends string> = Partial<Record<TField, SortOrder>>;

/**
 * `skip`, `take` and `orderBy` for a list query; spread it into `findMany` next to the `where`.
 * `columns` maps each API sort key to the model's column, so the API never exposes schema names.
 * `id` breaks ties so rows sharing a sort value never repeat or vanish between pages.
 */
export function toPrismaListArgs<TSortField extends string, TColumn extends string>(
  query: ListQuery<TSortField>,
  columns: Record<TSortField, TColumn>,
): { skip: number; take: number; orderBy: [OrderBy<TColumn>, OrderBy<'id'>] } {
  const bySortField: OrderBy<TColumn> = {};
  bySortField[columns[query.sortBy]] = query.sortOrder;
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: [bySortField, { id: SortOrder.ASC }],
  };
}
