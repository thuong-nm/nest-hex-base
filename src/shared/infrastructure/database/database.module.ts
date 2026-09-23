import { Global, Module } from '@nestjs/common';
import { TRANSACTION_RUNNER } from '#src/shared/kernel/ports/transaction-runner.port.js';
import { PrismaService } from './prisma.service.js';
import { PrismaTransactionHost } from './transaction.js';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaTransactionHost,
    { provide: TRANSACTION_RUNNER, useExisting: PrismaTransactionHost },
  ],
  exports: [PrismaService, PrismaTransactionHost, TRANSACTION_RUNNER],
})
export class DatabaseModule {}
