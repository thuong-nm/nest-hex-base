import { type ListQuery, SortOrder } from '#src/shared/kernel/list-query.js';

type SortValue = Date | string | number;

const compare = (a: SortValue, b: SortValue) => {
  const [x, y] = a instanceof Date && b instanceof Date ? [a.getTime(), b.getTime()] : [a, b];
  return x < y ? -1 : x > y ? 1 : 0;
};

/**
 * Sorts and pages rows that the fake repository has already filtered, the same way
 * `toPrismaListArgs` does: by `sortBy`/`sortOrder`, ties broken by ascending id.
 * `sortValues` maps a row to every API sort key (entities hold value objects, not columns).
 */
export function applyListQuery<T extends { id: string }, TSortField extends string>(
  rows: T[],
  query: ListQuery<TSortField>,
  sortValues: (row: T) => Record<TSortField, SortValue>,
): { items: T[]; total: number } {
  const direction = query.sortOrder === SortOrder.ASC ? 1 : -1;
  const sorted = [...rows].sort(
    (a, b) =>
      direction * compare(sortValues(a)[query.sortBy], sortValues(b)[query.sortBy]) ||
      compare(a.id, b.id),
  );
  const start = (query.page - 1) * query.limit;
  return { items: sorted.slice(start, start + query.limit), total: rows.length };
}
