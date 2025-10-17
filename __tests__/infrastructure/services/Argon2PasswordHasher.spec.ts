import { Argon2PasswordHasher } from '../../../src/infrastructure/services/Argon2PasswordHasher';

describe('Argon2PasswordHasher', () => {
  const password = 'Sup3rS3cret!';
  const hasher = new Argon2PasswordHasher({
    hash: {
      timeCost: 2,
      memoryCost: 1 << 15,
      parallelism: 1,
    },
  });

  it('hashes and verifies a password', async () => {
    const digest = await hasher.hash(password);

    expect(digest).not.toEqual(password);
    await expect(hasher.compare(password, digest)).resolves.toBe(true);
  });

  it('returns false when the password does not match', async () => {
    const digest = await hasher.hash(password);

    await expect(hasher.compare('not-the-password', digest)).resolves.toBe(false);
  });

  it('returns false when the digest is invalid', async () => {
    await expect(hasher.compare(password, 'invalid-hash')).resolves.toBe(false);
  });
});
