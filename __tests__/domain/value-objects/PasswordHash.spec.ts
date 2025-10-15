import { PasswordHash } from '../../../src/domain/value-objects/PasswordHash';

describe('Password Value Object', () => {
  it('should create a valid password', () => {
    const password = new PasswordHash('StrongPass1');
    expect(password.toString()).toBe('StrongPass1');
  });
});
