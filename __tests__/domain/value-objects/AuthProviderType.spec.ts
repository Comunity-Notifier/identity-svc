import { AuthProviderType, AuthProvider } from '../../../src/domain/value-objects/AuthProviderType';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('AuthProviderType Value Object', () => {
  it('should create a valid provider with CREDENTIAL', () => {
    const provider = new AuthProviderType(AuthProvider.CREDENTIAL);
    expect(provider.getProvider()).toBe(AuthProvider.CREDENTIAL);
  });

  it('should create a valid provider with GOOGLE', () => {
    const provider = new AuthProviderType(AuthProvider.GOOGLE);
    expect(provider.getProvider()).toBe(AuthProvider.GOOGLE);
  });

  it('should throw InvalidFormatError for unknown provider', () => {
    expect(() => new AuthProviderType('facebook' as AuthProvider)).toThrow(InvalidFormatError);
    expect(() => new AuthProviderType('facebook' as AuthProvider)).toThrow(
      'Invalid provider: "facebook"'
    );
  });

  it('should compare equality correctly', () => {
    const a = new AuthProviderType(AuthProvider.GOOGLE);
    const b = new AuthProviderType(AuthProvider.GOOGLE);
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal to a different provider', () => {
    const a = new AuthProviderType(AuthProvider.GOOGLE);
    const b = new AuthProviderType(AuthProvider.CREDENTIAL);
    expect(a.equals(b)).toBe(false);
  });

  it('should match provider using is()', () => {
    const provider = new AuthProviderType(AuthProvider.CREDENTIAL);
    expect(provider.is(AuthProvider.CREDENTIAL)).toBe(true);
    expect(provider.is(AuthProvider.GOOGLE)).toBe(false);
  });
});
