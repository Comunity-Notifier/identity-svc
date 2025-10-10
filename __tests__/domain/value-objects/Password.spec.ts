import { Password } from '../../../src/domain/value-objects/Password';
import { EmptyValueError } from '../../../src/domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('Password Value Object', () => {
  describe('Plain password (isHashed = false)', () => {
    it('should create a valid plain password', () => {
      const password = new Password('StrongPass1', false);
      expect(password.toString()).toBe('StrongPass1');
    });

    it('should throw EmptyValueError if password is empty', () => {
      expect(() => new Password('', false)).toThrow(EmptyValueError);
      expect(() => new Password('', false)).toThrow('Password is required');
    });

    it('should throw InvalidFormatError if password is too short', () => {
      expect(() => new Password('S1a', false)).toThrow(InvalidFormatError);
      expect(() => new Password('S1a', false)).toThrow('Password must have at least 8 characters');
    });

    it('should throw InvalidFormatError if password lacks a number', () => {
      expect(() => new Password('StrongPass', false)).toThrow(InvalidFormatError);
      expect(() => new Password('StrongPass', false)).toThrow(
        'Password must contain at least one number'
      );
    });

    it('should throw InvalidFormatError if password lacks an uppercase letter', () => {
      expect(() => new Password('strongpass1', false)).toThrow(InvalidFormatError);
      expect(() => new Password('strongpass1', false)).toThrow(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should throw InvalidFormatError if password lacks a lowercase letter', () => {
      expect(() => new Password('STRONGPASS1', false)).toThrow(InvalidFormatError);
      expect(() => new Password('STRONGPASS1', false)).toThrow(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should compare equality correctly', () => {
      const a = new Password('StrongPass1', false);
      const b = new Password('StrongPass1', false);
      expect(a.equals(b)).toBe(true);
    });
  });

  describe('Hashed password (isHashed = true)', () => {
    it('should accept any non-empty string as hashed password', () => {
      const hashed = new Password('$2b$10$abc123', true);
      expect(hashed.toString()).toBe('$2b$10$abc123');
    });

    it('should throw EmptyValueError if hashed password is empty', () => {
      expect(() => new Password('', true)).toThrow(EmptyValueError);
      expect(() => new Password('', true)).toThrow('Password is required');
    });

    it('should compare equality correctly for hashed passwords', () => {
      const a = new Password('$2b$10$abc123', true);
      const b = new Password('$2b$10$abc123', true);
      expect(a.equals(b)).toBe(true);
    });
  });
});
