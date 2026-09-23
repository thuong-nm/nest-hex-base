export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Return this from a controller for list endpoints. The response interceptor puts `items` in
 * `data` and the pagination numbers in `meta.pagination`.
 */
export class PaginatedResponse<T> {
  readonly pagination: PaginationMeta;

  constructor(
    readonly items: T[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
