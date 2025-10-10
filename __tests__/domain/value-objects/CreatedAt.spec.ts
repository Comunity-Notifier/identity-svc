import { CreatedAt } from '../../../src/domain/value-objects/CreatedAt';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('CreatedAt Value Object', () => {
  it('should create a valid date', () => {
    const date = new Date('2025-10-10T10:00:00Z');
    const createdAt = new CreatedAt(date);
    expect(createdAt.toDate()).toEqual(date);
    expect(createdAt.toISOString()).toBe(date.toISOString());
  });

  it('should throw InvalidFormatError if date is invalid', () => {
    expect(() => new CreatedAt(new Date('invalid-date'))).toThrow(InvalidFormatError);
    expect(() => new CreatedAt(new Date('invalid-date'))).toThrow('Value must be a valid Date');
  });

  it('should compare equality correctly', () => {
    const date = new Date('2025-10-10T10:00:00Z');
    const a = new CreatedAt(date);
    const b = new CreatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(a.equals(b)).toBe(true);
  });

  it('should detect if one date is before another', () => {
    const earlier = new CreatedAt(new Date('2025-10-10T09:00:00Z'));
    const later = new CreatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(earlier.isBefore(later.toDate())).toBe(true);
    expect(later.isBefore(earlier.toDate())).toBe(false);
  });

  it('should detect if one date is after another', () => {
    const earlier = new CreatedAt(new Date('2025-10-10T09:00:00Z'));
    const later = new CreatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(later.isAfter(earlier.toDate())).toBe(true);
    expect(earlier.isAfter(later.toDate())).toBe(false);
  });
});
