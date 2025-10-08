import argon2, { type Options as Argon2Options } from 'argon2';

import { PasswordHasher } from '../../application/ports/passwordHasher';
import { PasswordHash } from '../../domain/valueObjects/passwordHash';

export class Argon2PasswordHasher implements PasswordHasher {
  constructor(private readonly options: Partial<Argon2Options> = {}) {}

  async hash(plain: string): Promise<PasswordHash> {
    const hash = await argon2.hash(plain, {
      type: argon2.argon2id,
      ...this.options,
    });
    return PasswordHash.create(hash);
  }

  async verify(plain: string, hash: PasswordHash): Promise<boolean> {
    try {
      return await argon2.verify(hash.toString(), plain);
    } catch {
      return false;
    }
  }
}
