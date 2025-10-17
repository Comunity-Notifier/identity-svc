import { hash as argon2Hash, verify as argon2Verify, argon2id, Options } from 'argon2';
import { PasswordHasher } from '../../application/ports/PasswordHasher';

type HashOptions = Options & { raw?: false };

export interface Argon2PasswordHasherOptions {
  hash?: HashOptions;
  verify?: {
    secret?: Buffer;
  };
}

const DEFAULT_HASH_OPTIONS: HashOptions = {
  type: argon2id,
  timeCost: 3,
  memoryCost: 1 << 16,
  parallelism: 1,
};

/**
 * Argon2-based implementation of {@link PasswordHasher} that defaults to the Argon2id variant.
 *
 * The constructor accepts optional tuning parameters for hashing (e.g. time/memory cost)
 * and verification (e.g. shared secret). Any provided overrides are merged with a safe baseline,
 * so callers can tweak ergonomics without redefining every setting.
 */
export class Argon2PasswordHasher implements PasswordHasher {
  private readonly hashOptions: HashOptions;

  private readonly verifyOptions?: Argon2PasswordHasherOptions['verify'];

  constructor(options: Argon2PasswordHasherOptions = {}) {
    this.hashOptions = {
      ...DEFAULT_HASH_OPTIONS,
      ...options.hash,
    };
    this.verifyOptions = options.verify;
  }

  async hash(password: string): Promise<string> {
    return argon2Hash(password, this.hashOptions);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2Verify(hash, password, this.verifyOptions);
    } catch {
      return false;
    }
  }
}
