import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { TransactionRunner } from '#src/shared/kernel/ports/transaction-runner.port.js';
import type { Prisma } from '#src/generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

export type PrismaDb = Prisma.TransactionClient;

/**
 * Ambient transaction via AsyncLocalStorage: use cases call `TransactionRunner.run()` without
 * knowing about Prisma, and repositories read `client` to pick up the active transaction.
 */
@Injectable()
export class PrismaTransactionHost implements TransactionRunner {
  private readonly storage = new AsyncLocalStorage<PrismaDb>();

  constructor(private readonly prisma: PrismaService) {}

  get client(): PrismaDb {
    return this.storage.getStore() ?? this.prisma;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.storage.getStore()) return work();
    return this.prisma.$transaction((tx) => this.storage.run(tx, work));
  }
}
