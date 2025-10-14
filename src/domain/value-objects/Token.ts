import { StringValueObject } from './base/StringValueObject';

export class Token extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMatches(
      /^eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/,
      'Invalid token format: JWT expected'
    );
  }
}
