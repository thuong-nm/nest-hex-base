import type { RefreshTokenRepository } from '#src/modules/auth/application/ports/refresh-token.repository.port.js';
import { RefreshToken } from '#src/modules/auth/domain/entities/refresh-token.entity.js';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly rows = new Map<string, RefreshToken>();

  private snapshot(token: RefreshToken): RefreshToken {
    return RefreshToken.restore(token.id, {
      userId: token.userId,
      familyId: token.familyId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      replacedBy: token.replacedBy,
      createdAt: token.createdAt,
    });
  }

  all(): RefreshToken[] {
    return [...this.rows.values()].map((t) => this.snapshot(t));
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const token = [...this.rows.values()].find((t) => t.tokenHash === tokenHash);
    return token ? this.snapshot(token) : null;
  }

  async create(token: RefreshToken): Promise<void> {
    this.rows.set(token.id, this.snapshot(token));
  }

  async revokeIfActive(token: RefreshToken): Promise<boolean> {
    const stored = this.rows.get(token.id);
    if (!stored || stored.isRevoked) return false;
    this.rows.set(token.id, this.snapshot(token));
    return true;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    for (const token of this.rows.values()) if (token.familyId === familyId) token.revoke(now);
  }

  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    for (const token of this.rows.values()) if (token.userId === userId) token.revoke(now);
  }
}
