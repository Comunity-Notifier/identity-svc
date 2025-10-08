const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class Email {
  private constructor(private readonly raw: string) {}

  static create(value: string): Email {
    if (!value) {
      throw new Error('Email is required');
    }

    const normalized = value.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error(`Invalid email: ${value}`);
    }

    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.raw === other.raw;
  }

  toString(): string {
    return this.raw;
  }
}
