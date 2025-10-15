import { StringValueObject } from './base/StringValueObject';

export class AccountExternalId extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMinLength(1);
    this.ensureMaxLength(255);
  }
}
