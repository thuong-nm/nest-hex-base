import type { RefreshToken } from '../../domain/entities/refresh-token.entity.js';

export interface RefreshTokenRepository {
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  create(token: RefreshToken): Promise<void>;
  /**
   * Persists `token`'s revocation only if the stored row is still unrevoked, atomically.
   * Returns false when someone else revoked it first: the caller must treat that as reuse.
   */
  revokeIfActive(token: RefreshToken): Promise<boolean>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
  revokeAllForUser(userId: string, now: Date): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
