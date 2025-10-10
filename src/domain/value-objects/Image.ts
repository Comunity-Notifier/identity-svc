import { StringValueObject } from './base/StringValueObject';

export class Image extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMatches(
      /^https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/,
      'Url not valid'
    );
  }
}
