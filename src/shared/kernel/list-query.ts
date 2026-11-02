/**
 * Search, sort and pagination accepted by every list use case and repository (AGENTS.md
 * "Add a list endpoint"). A module's list criteria extend `ListQuery` with its own filters.
 */
export const BASE_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;

export type BaseSortField = (typeof BASE_SORT_FIELDS)[number];

/**
 * The keys a list can be sorted by: `createdAt` and `updatedAt`, plus the module's own.
 * Each key is a field name as the API returns it, never a column name (the repository maps keys
 * to columns). Only expose fields the response shows: sorting by a hidden one leaks its order.
 */
export function sortFields<const T extends string = never>(
  ...extra: T[]
): readonly (BaseSortField | T)[] {
  return [...BASE_SORT_FIELDS, ...extra];
}

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const SORT_ORDERS: readonly SortOrder[] = Object.values(SortOrder);

export interface ListQuery<TSortField extends string = BaseSortField> {
  page: number;
  limit: number;
  /** Case-insensitive substring match; each module decides which fields it searches. */
  search?: string;
  sortBy: TSortField;
  sortOrder: SortOrder;
}

export const DEFAULT_LIST_QUERY = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: SortOrder.DESC,
} as const satisfies ListQuery;

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Trims the search term; a blank term means "no search". */
export function normalizeSearch(search: string | undefined): string | undefined {
  const trimmed = search?.trim();
  return trimmed ? trimmed : undefined;
}
