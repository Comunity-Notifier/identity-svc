import { InvalidFormatError } from '../../errors/value-objects/InvalidFormatError';

export abstract class DateValueObject {
  protected readonly value: Date;

  constructor(value: Date) {
    this.value = value;
    this.ensureIsValid(value);
  }

  private ensureIsValid(date: Date): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new InvalidFormatError('Value must be a valid Date');
    }
  }

  toDate(): Date {
    return this.value;
  }

  toISOString(): string {
    return this.value.toISOString();
  }

  isBefore(other: Date): boolean {
    return this.value.getTime() < other.getTime();
  }

  isAfter(other: Date): boolean {
    return this.value.getTime() > other.getTime();
  }

  equals(other: DateValueObject): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
