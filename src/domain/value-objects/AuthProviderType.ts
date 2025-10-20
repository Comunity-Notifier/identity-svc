import { InvalidFormatError } from '../errors/value-objects/InvalidFormatError';

export enum AuthProvider {
  GOOGLE = 'google',
}

export class AuthProviderType {
  private readonly provider: AuthProvider;

  constructor(value: AuthProvider) {
    this.provider = this.ensureEnum(value);
  }

  private ensureEnum(value: AuthProvider): AuthProvider {
    if (!Object.values(AuthProvider).includes(value)) {
      throw new InvalidFormatError(`Invalid provider: "${value}"`);
    }
    return value;
  }

  getProvider(): AuthProvider {
    return this.provider;
  }

  is(provider: AuthProvider): boolean {
    return this.provider === provider;
  }

  equals(other: AuthProviderType): boolean {
    return this.provider === other.provider;
  }
}
