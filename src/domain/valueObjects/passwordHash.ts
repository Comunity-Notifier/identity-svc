export class PasswordHash {
  private constructor(private readonly hash: string) {}

  static create(hash: string): PasswordHash {
    if (!hash) {
      throw new Error('Password hash is required');
    }

    const normalized = hash.trim();
    if (normalized.length === 0) {
      throw new Error('Password hash cannot be empty');
    }

    return new PasswordHash(normalized);
  }

  toString(): string {
    return this.hash;
  }
}
