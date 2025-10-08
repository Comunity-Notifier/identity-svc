import { describe, expect, it } from '@jest/globals';

import { Argon2PasswordHasher } from '../../../src/infrastructure/crypto/passwordHasherArgon2';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('hashes and verifies passwords successfully', async () => {
    const hash = await hasher.hash('sup3r-secret');
    expect(hash.toString()).not.toBe('sup3r-secret');

    const verified = await hasher.verify('sup3r-secret', hash);
    expect(verified).toBe(true);
  });

  it('fails verification with invalid password', async () => {
    const hash = await hasher.hash('another-secret');

    const verified = await hasher.verify('wrong-password', hash);
    expect(verified).toBe(false);
  });
});
