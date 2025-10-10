import { StringValueObject } from './base/StringValueObject';

export class Password extends StringValueObject {
  private readonly isHashed: boolean;

  private constructor(value: string, isHashed: boolean) {
    super(value);
    this.isHashed = isHashed;

    if (!isHashed) {
      this.ensureMinLength(8);
      this.ensureMatches(/(?=.*\d)/, 'Password must contain at least one number');
      this.ensureMatches(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter');
      this.ensureMatches(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter');
    }
  }

  static fromPlain(value: string): Password {
    return new Password(value, false);
  }

  static fromHash(value: string): Password {
    return new Password(value, true);
  }
}
