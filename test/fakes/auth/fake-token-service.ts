import type {
  OpaqueToken,
  SignedAccessToken,
  TokenService,
} from '#src/modules/auth/application/ports/token-service.port.js';

export class FakeTokenService implements TokenService {
  private counter = 0;

  async signAccessToken(claims: { userId: string; role: string }): Promise<SignedAccessToken> {
    return { token: `access:${claims.userId}:${claims.role}`, expiresInSeconds: 900 };
  }

  generateRefreshToken(): OpaqueToken {
    this.counter += 1;
    const token = `refresh-${this.counter}`;
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return `hash(${token})`;
  }
}
