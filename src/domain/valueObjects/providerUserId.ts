export class ProviderUserId {
  private constructor(private readonly raw: string) {}

  static create(value: string): ProviderUserId {
    if (!value) {
      throw new Error('Provider user id is required');
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new Error('Provider user id cannot be empty');
    }

    return new ProviderUserId(normalized);
  }

  toString(): string {
    return this.raw;
  }
}
