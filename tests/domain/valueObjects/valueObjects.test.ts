import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { Provider, SUPPORTED_PROVIDERS } from '../../../src/domain/valueObjects/provider';
import { ProviderUserId } from '../../../src/domain/valueObjects/providerUserId';
import { UserId } from '../../../src/domain/valueObjects/userId';

describe('identity value objects', () => {
  it('normalizes email to lowercase', () => {
    const email = Email.create('User@Example.com');
    expect(email.toString()).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => Email.create('invalid-email')).toThrow('Invalid email');
  });

  it('validates name boundaries', () => {
    expect(() => Name.create('')).toThrow('Name is required');
    expect(() => Name.create(' '.repeat(2))).toThrow('Name cannot be empty');
    expect(() => Name.create('a'.repeat(121))).toThrow('Name is too long');
    expect(Name.create('Ada Lovelace').toString()).toBe('Ada Lovelace');
  });

  it.each(SUPPORTED_PROVIDERS)('accepts provider %s', (provider) => {
    expect(Provider.create(provider).toString()).toBe(provider);
  });

  it('rejects unsupported provider', () => {
    expect(() => Provider.create('facebook')).toThrow('Unsupported provider');
  });

  it('normalizes provider user id', () => {
    const providerUserId = ProviderUserId.create(' 123 ');
    expect(providerUserId.toString()).toBe('123');
  });

  it('generates valid user id', () => {
    const id = UserId.generate().toString();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('validates uuid format', () => {
    expect(() => UserId.create('invalid-uuid')).toThrow('Invalid user id');
  });
});
