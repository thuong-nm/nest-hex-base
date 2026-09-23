import type { TransactionRunner } from '#src/shared/kernel/ports/transaction-runner.port.js';

export class ImmediateTransactionRunner implements TransactionRunner {
  runs = 0;

  run<T>(work: () => Promise<T>): Promise<T> {
    this.runs += 1;
    return work();
  }
}
