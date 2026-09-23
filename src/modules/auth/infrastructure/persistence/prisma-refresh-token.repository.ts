import { Injectable } from '@nestjs/common';
import { PrismaTransactionHost } from '#src/shared/infrastructure/database/transaction.js';
import type { RefreshTokenRepository } from '../../application/ports/refresh-token.repository.port.js';
import type { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { RefreshTokenMapper } from './refresh-token.mapper.js';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: PrismaTransactionHost) {}

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.db.client.refreshToken.findUnique({ where: { tokenHash } });
    return row ? RefreshTokenMapper.toDomain(row) : null;
  }

  async create(token: RefreshToken): Promise<void> {
    await this.db.client.refreshToken.create({ data: RefreshTokenMapper.toPersistence(token) });
  }

  async revokeIfActive(token: RefreshToken): Promise<boolean> {
    // Conditional UPDATE: under concurrency the second writer waits on the row lock, then matches 0 rows.
    const { count } = await this.db.client.refreshToken.updateMany({
      where: { id: token.id, revokedAt: null },
      data: { revokedAt: token.revokedAt ?? new Date(), replacedBy: token.replacedBy },
    });
    return count === 1;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.db.client.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    await this.db.client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
