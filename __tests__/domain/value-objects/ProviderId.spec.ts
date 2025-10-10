import { ProviderId } from '../../../src/domain/value-objects/ProviderId';
import { AuthProvider } from '../../../src/domain/value-objects/ProviderId';
import { InvalidFormatError } from '../../../src/domain/errors/value-objects/InvalidFormatError';

describe('ProviderId Value Object', () => {
  it('should create a valid provider with CREDENTIAL', () => {
    const provider = new ProviderId(AuthProvider.CREDENTIAL);
    expect(provider.getProvider()).toBe(AuthProvider.CREDENTIAL);
  });

  it('should create a valid provider with GOOGLE', () => {
    const provider = new ProviderId(AuthProvider.GOOGLE);
    expect(provider.getProvider()).toBe(AuthProvider.GOOGLE);
  });

  it('should throw InvalidFormatError for unknown provider', () => {
    expect(() => new ProviderId('facebook' as AuthProvider)).toThrow(InvalidFormatError);
    expect(() => new ProviderId('facebook' as AuthProvider)).toThrow(
      'Invalid provider: "facebook"'
    );
  });

  it('should compare equality correctly', () => {
    const a = new ProviderId(AuthProvider.GOOGLE);
    const b = new ProviderId(AuthProvider.GOOGLE);
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal to a different provider', () => {
    const a = new ProviderId(AuthProvider.GOOGLE);
    const b = new ProviderId(AuthProvider.CREDENTIAL);
    expect(a.equals(b)).toBe(false);
  });

  it('should match provider using isProvider()', () => {
    const provider = new ProviderId(AuthProvider.CREDENTIAL);
    expect(provider.isProvider(AuthProvider.CREDENTIAL)).toBe(true);
    expect(provider.isProvider(AuthProvider.GOOGLE)).toBe(false);
  });
});
