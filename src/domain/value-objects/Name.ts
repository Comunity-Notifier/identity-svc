import { StringValueObject } from './base/StringValueObject';

export class Name extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMinLength(1);
    this.ensureMaxLength(50);
  }
}
