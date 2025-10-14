import { DateValueObject } from './base/DateValueObject';

export class CreatedAt extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
