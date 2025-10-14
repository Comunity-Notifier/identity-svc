import { Password } from '../../../src/domain/value-objects/Password';

describe('Password Value Object', () => {
  it('should create a valid password', () => {
    const password = new Password('StrongPass1');
    expect(password.toString()).toBe('StrongPass1');
  });
});
