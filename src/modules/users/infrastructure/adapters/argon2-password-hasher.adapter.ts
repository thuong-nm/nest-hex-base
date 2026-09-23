import { Injectable, type OnModuleInit } from '@nestjs/common';
import argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher.port.js';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher, OnModuleInit {
  // Verified against when the user does not exist, so unknown emails cost the same as wrong passwords.
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash('dummy-password-for-timing-equalization');
  }

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(hash: string | null, plain: string): Promise<boolean> {
    try {
      const matches = await argon2.verify(hash ?? this.dummyHash, plain);
      return hash !== null && matches;
    } catch {
      return false;
    }
  }
}
