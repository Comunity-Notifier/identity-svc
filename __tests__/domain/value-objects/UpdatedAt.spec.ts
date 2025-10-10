import { UpdatedAt } from '../../../src/domain/value-objects/UpdatedAt';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('UpdatedAt Value Object', () => {
  it('should create a valid date', () => {
    const date = new Date('2025-10-10T10:00:00Z');
    const updatedAt = new UpdatedAt(date);
    expect(updatedAt.toDate()).toEqual(date);
    expect(updatedAt.toISOString()).toBe(date.toISOString());
  });

  it('should throw InvalidFormatError if date is invalid', () => {
    expect(() => new UpdatedAt(new Date('invalid-date'))).toThrow(InvalidFormatError);
    expect(() => new UpdatedAt(new Date('invalid-date'))).toThrow('Value must be a valid Date');
  });

  it('should compare equality correctly', () => {
    const date = new Date('2025-10-10T10:00:00Z');
    const a = new UpdatedAt(date);
    const b = new UpdatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(a.equals(b)).toBe(true);
  });

  it('should detect if one date is before another', () => {
    const earlier = new UpdatedAt(new Date('2025-10-10T09:00:00Z'));
    const later = new UpdatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(earlier.isBefore(later.toDate())).toBe(true);
    expect(later.isBefore(earlier.toDate())).toBe(false);
  });

  it('should detect if one date is after another', () => {
    const earlier = new UpdatedAt(new Date('2025-10-10T09:00:00Z'));
    const later = new UpdatedAt(new Date('2025-10-10T10:00:00Z'));
    expect(later.isAfter(earlier.toDate())).toBe(true);
    expect(earlier.isAfter(later.toDate())).toBe(false);
  });
});
