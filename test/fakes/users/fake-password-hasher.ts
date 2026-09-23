import type { PasswordHasher } from '#src/modules/users/application/ports/password-hasher.port.js';

export class FakePasswordHasher implements PasswordHasher {
  verifyCalls = 0;

  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string | null, plain: string): Promise<boolean> {
    this.verifyCalls += 1;
    return hash === `hashed:${plain}`;
  }
}
