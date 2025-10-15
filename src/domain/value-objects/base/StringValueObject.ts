import { EmptyValueError } from '../../errors/value-objects/EmptyValueError';
import { InvalidFormatError } from '../../errors/value-objects/InvalidFormatError';

export abstract class StringValueObject {
  protected readonly value: string;

  constructor(value: string) {
    this.ensureIsNotEmpty(value);
    this.value = value;
  }

  private ensureIsNotEmpty(value: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new EmptyValueError(`${this.constructor.name} is required`);
    }
  }

  protected ensureMinLength(min: number): void {
    if (this.value.length < min) {
      throw new InvalidFormatError(`${this.constructor.name} must have at least ${min} characters`);
    }
  }

  protected ensureMaxLength(max: number): void {
    if (this.value.length > max) {
      throw new InvalidFormatError(
        `${this.constructor.name} cannot have more than ${max} characters`
      );
    }
  }

  protected ensureMatches(pattern: RegExp, errorMessage: string): void {
    if (!pattern.test(this.value)) {
      throw new InvalidFormatError(errorMessage);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: StringValueObject): boolean {
    return this.value === other.value;
  }
}
