import { Email } from 'src/domain/value-objects/Email';
import { EmptyValueError } from 'src/domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from 'src/domain/errors/value-objects/InvalidFormatError';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    const email = new Email('Test@Example.com');
    expect(email.toString()).toBe('test@example.com'); // lowercase enforced
  });

  it('should throw EmptyValueError if email is empty', () => {
    expect(() => new Email('')).toThrow(EmptyValueError);
    expect(() => new Email('')).toThrow('Email is required');
  });

  it('should throw EmptyValueError if email is only spaces', () => {
    expect(() => new Email('   ')).toThrow(EmptyValueError);
  });

  it('should throw InvalidFormatError if email is invalid format', () => {
    expect(() => new Email('invalid-email')).toThrow(InvalidFormatError);
    expect(() => new Email('invalid-email')).toThrow('Email must be valid');
  });

  it('should compare equality correctly', () => {
    const a = new Email('user@example.com');
    const b = new Email('USER@example.com');
    expect(a.equals(b)).toBe(true);
  });
});
