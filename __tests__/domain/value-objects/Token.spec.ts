import { Token } from '../../../src/domain/value-objects/Token';
import { EmptyValueError } from '../../../src/domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('Token Value Object', () => {
  it('should create a valid JWT token', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const token = new Token(jwt);
    expect(token.toString()).toBe(jwt);
  });

  it('should throw EmptyValueError if token is empty', () => {
    expect(() => new Token('')).toThrow(EmptyValueError);
    expect(() => new Token('')).toThrow('Token is required');
  });

  it('should throw InvalidFormatError if token is not a valid JWT', () => {
    expect(() => new Token('invalid.token')).toThrow(InvalidFormatError);
    expect(() => new Token('invalid.token')).toThrow('Invalid token format: JWT expected');
  });

  it('should compare equality correctly', () => {
    const jwt = 'eyJabc.def.ghi';
    const a = new Token(jwt);
    const b = new Token(jwt);
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal to a different token', () => {
    const a = new Token('eyJabc.def.ghi');
    const b = new Token('eyJxyz.def.ghi');
    expect(a.equals(b)).toBe(false);
  });
});
