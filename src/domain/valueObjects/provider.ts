export const SUPPORTED_PROVIDERS = ['google', 'github', 'local'] as const;
export type ProviderCode = (typeof SUPPORTED_PROVIDERS)[number];

export class Provider {
  private constructor(private readonly provider: ProviderCode) {}

  static create(provider: string): Provider {
    if (!provider) {
      throw new Error('Provider is required');
    }

    const normalized = provider.trim().toLowerCase() as ProviderCode;
    if (!SUPPORTED_PROVIDERS.includes(normalized)) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Provider(normalized);
  }

  equals(other: Provider): boolean {
    return this.provider === other.provider;
  }

  toString(): ProviderCode {
    return this.provider;
  }
}
