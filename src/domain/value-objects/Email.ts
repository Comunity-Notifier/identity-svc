import { StringValueObject } from './base/StringValueObject';

export class Email extends StringValueObject {
  constructor(value: string) {
    super(value.toLocaleLowerCase());
    this.ensureMatches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid');
  }
}
