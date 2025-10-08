import { randomUUID } from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    if (!value) {
      throw new Error('User id is required');
    }

    const normalized = value.trim().toLowerCase();
    if (!UUID_REGEX.test(normalized)) {
      throw new Error(`Invalid user id: ${value}`);
    }

    return new UserId(normalized);
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  toString(): string {
    return this.value;
  }
}
