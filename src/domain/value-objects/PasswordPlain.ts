import { StringValueObject } from './base/StringValueObject';

export class PasswordPlain extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMinLength(8);
    this.ensureMaxLength(128);
    this.ensureMatches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/,
      'PasswordPlain does not meet complexity requirements'
    );
  }
}
