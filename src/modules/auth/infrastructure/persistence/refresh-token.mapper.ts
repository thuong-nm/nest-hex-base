import type { Prisma, RefreshToken as PrismaRefreshToken } from '#src/generated/prisma/client.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';

export const RefreshTokenMapper = {
  toDomain(row: PrismaRefreshToken): RefreshToken {
    return RefreshToken.restore(row.id, {
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedBy: row.replacedBy,
      createdAt: row.createdAt,
    });
  },

  toPersistence(token: RefreshToken): Prisma.RefreshTokenCreateInput {
    return {
      id: token.id,
      userId: token.userId,
      familyId: token.familyId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      replacedBy: token.replacedBy,
      createdAt: token.createdAt,
    };
  },
};
