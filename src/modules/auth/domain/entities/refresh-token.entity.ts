import { Entity } from '#src/shared/kernel/domain/entity.base.js';

export interface RefreshTokenProps {
  userId: string;
  /** All tokens rotated from one login share a family; reuse of any revoked member kills the family. */
  familyId: string;
  /** Only the hash is stored; the plain token exists only in the client. */
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export class RefreshToken extends Entity {
  private constructor(
    id: string,
    private props: RefreshTokenProps,
  ) {
    super(id);
  }

  static issue(input: {
    id: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    now: Date;
    ttlSeconds: number;
  }): RefreshToken {
    return new RefreshToken(input.id, {
      userId: input.userId,
      familyId: input.familyId,
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.now.getTime() + input.ttlSeconds * 1000),
      revokedAt: null,
      replacedBy: null,
      createdAt: input.now,
    });
  }

  static restore(id: string, props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(id, { ...props });
  }

  get userId(): string {
    return this.props.userId;
  }
  get familyId(): string {
    return this.props.familyId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get replacedBy(): string | null {
    return this.props.replacedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  revoke(now: Date, replacedBy: string | null = null): void {
    if (this.isRevoked) return;
    this.props = { ...this.props, revokedAt: now, replacedBy };
  }
}
