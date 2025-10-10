import { StringValueObject } from './base/StringValueObject';

export class Id extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureMatches(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      'Invalid Id'
    );
  }
}
