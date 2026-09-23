/**
 * Runs `work` in one database transaction. Repositories called inside `work` join it
 * automatically; nested calls reuse the outer transaction.
 */
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');
