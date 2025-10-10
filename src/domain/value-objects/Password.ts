import { StringValueObject } from './base/StringValueObject';

export class Password extends StringValueObject {
  private readonly isHashed: boolean;

  constructor(value: string, isHashed: boolean) {
    super(value);
    this.isHashed = isHashed;

    if (!isHashed) {
      this.ensureMinLength(8);
      this.ensureMatches(/(?=.*\d)/, 'Password must contain at least one number');
      this.ensureMatches(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter');
      this.ensureMatches(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter');
    }
  }
}
