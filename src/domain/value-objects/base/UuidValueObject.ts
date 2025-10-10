import { InvalidFormatError } from '../../errors/value-objects/InvalidFormatError';

export abstract class UUIDValueObject {
  protected value: string;

  constructor(value: string) {
    this.ensureIsUUID(value);
    this.value = value;
  }

  private ensureIsUUID(value: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) {
      throw new InvalidFormatError(`${this.constructor.name} invalid format`);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: UUIDValueObject): boolean {
    return this.value === other.value;
  }
}
