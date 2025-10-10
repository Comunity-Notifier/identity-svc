import { InvalidFormatError } from '../errors/value-objects/InvalidFormatError';

export enum AuthProvider {
  CREDENTIAL = 'credential',
  GOOGLE = 'google',
}

export class ProviderId {
  private readonly provider: AuthProvider;

  constructor(value: AuthProvider) {
    this.provider = this.ensureEnum(value);
  }

  private ensureEnum(value: unknown): AuthProvider {
    if (!Object.values(AuthProvider).includes(value as AuthProvider)) {
      throw new InvalidFormatError(`Invalid provider: "${value}"`);
    }
    return value as AuthProvider;
  }

  getProvider(): AuthProvider {
    return this.provider;
  }

  isProvider(provider: AuthProvider): boolean {
    return this.provider === provider;
  }

  equals(other: ProviderId): boolean {
    return this.provider === other.provider;
  }
}
