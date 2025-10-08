export class Name {
  private constructor(private readonly raw: string) {}

  static create(value: string): Name {
    if (!value) {
      throw new Error('Name is required');
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new Error('Name cannot be empty');
    }

    if (normalized.length > 120) {
      throw new Error('Name is too long');
    }

    return new Name(normalized);
  }

  toString(): string {
    return this.raw;
  }
}
