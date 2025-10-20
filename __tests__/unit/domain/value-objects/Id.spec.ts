import { Id } from 'src/domain/value-objects/Id';
import { InvalidFormatError } from 'src/domain/errors/value-objects/InvalidFormatError';

describe('Id Value Object', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const anotherUUID = '123e4567-e89b-12d3-a456-426614174999';
  const invalidUUID = 'not-a-valid-uuid';

  it('should create a valid UUID', () => {
    const id = new Id(validUUID);
    expect(id.toString()).toBe(validUUID);
  });

  it('should throw InvalidFormatError if UUID is invalid', () => {
    expect(() => new Id(invalidUUID)).toThrow(InvalidFormatError);
    expect(() => new Id(invalidUUID)).toThrow('Id invalid format');
  });

  it('should throw InvalidFormatError if UUID is empty', () => {
    expect(() => new Id('')).toThrow(InvalidFormatError);
    expect(() => new Id('')).toThrow('Id invalid format');
  });

  it('should compare equality correctly', () => {
    const a = new Id(validUUID);
    const b = new Id(validUUID);
    const c = new Id(anotherUUID);

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
