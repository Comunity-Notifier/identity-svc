import { UUIDValueObject } from './base/UuidValueObject';

export class Id extends UUIDValueObject {
  constructor(value: string) {
    super(value);
  }
}
