import { StringValueObject } from './base/StringValueObject';

export class PasswordHash extends StringValueObject {
  constructor(value: string) {
    super(value);
  }
}
