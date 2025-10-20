import { Name } from 'src/domain/value-objects/Name';
import { EmptyValueError } from 'src/domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from 'src/domain/errors/value-objects/InvalidFormatError';

describe('Name Value Object', () => {
  it('should create a valid name', () => {
    const name = new Name('Henry');
    expect(name.toString()).toBe('Henry');
  });

  it('should throw EmptyValueError if name is empty', () => {
    expect(() => new Name('')).toThrow(EmptyValueError);
    expect(() => new Name('')).toThrow('Name is required');
  });

  it('should throw InvalidFormatError if name is too long', () => {
    const longName = 'A'.repeat(51);
    expect(() => new Name(longName)).toThrow(InvalidFormatError);
    expect(() => new Name(longName)).toThrow('Name cannot have more than 50 characters');
  });

  it('should compare equality correctly', () => {
    const a = new Name('Henry');
    const b = new Name('Henry');
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal to a different name', () => {
    const a = new Name('Henry');
    const b = new Name('Henri');
    expect(a.equals(b)).toBe(false);
  });
});
