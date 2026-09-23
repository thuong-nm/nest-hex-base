export interface SignedAccessToken {
  token: string;
  expiresInSeconds: number;
}

export interface OpaqueToken {
  /** Returned to the client once; never stored. */
  token: string;
  /** Stored and used for lookup. */
  hash: string;
}

export interface TokenService {
  signAccessToken(claims: { userId: string; role: string }): Promise<SignedAccessToken>;
  generateRefreshToken(): OpaqueToken;
  hashRefreshToken(token: string): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
