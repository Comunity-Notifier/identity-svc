import { describe, expect, it, jest } from '@jest/globals';

import { StartOAuth, StartOAuthDeps } from '../../../src/application/useCases/startOAuth';
import { OAuthStateStore } from '../../../src/application/ports/oauthStateStore';
import {
  OAuthAuthorizationRequest,
  OAuthProvider,
} from '../../../src/application/ports/oauthProvider';
import { ProviderNotConfiguredError } from '../../../src/domain/domainErrors';

const fixedNow = new Date('2024-01-01T00:00:00.000Z');

const buildProvider = (): jest.Mocked<OAuthProvider> => ({
  provider: 'google',
  buildAuthorizationUrl: jest.fn(),
  getProfile: jest.fn(),
});

const buildDeps = (overrides: Partial<StartOAuthDeps> = {}): StartOAuthDeps => {
  const stateStore: jest.Mocked<OAuthStateStore> = {
    save: jest.fn(),
    get: jest.fn(),
    consume: jest.fn(),
  };

  const provider = buildProvider();
  provider.buildAuthorizationUrl.mockResolvedValue('https://accounts.google.com/auth');

  return {
    oauthStateStore: stateStore,
    oauthProviders: { google: provider },
    now: () => fixedNow,
    stateTtlMs: 5 * 60 * 1000,
    generateState: () => 'state-123',
    generateCodeVerifier: () => 'codeVerifier-abc',
    generateNonce: () => 'nonce-xyz',
    ...overrides,
  };
};

describe('StartOAuth use case', () => {
  it('persists state and returns authorization url', async () => {
    const deps = buildDeps();
    const useCase = new StartOAuth(deps);

    const result = await useCase.execute({
      provider: 'google',
      redirectUri: 'https://app.example.com/oauth/callback',
      nonce: true,
    });

    const providerMock = deps.oauthProviders.google as jest.Mocked<OAuthProvider>;
    const buildAuthArgs = providerMock.buildAuthorizationUrl.mock.calls[0][0];
    expect(buildAuthArgs).toEqual({
      redirectUri: 'https://app.example.com/oauth/callback',
      state: 'state-123',
      codeVerifier: 'codeVerifier-abc',
      nonce: 'nonce-xyz',
    });
    expect(buildAuthArgs satisfies OAuthAuthorizationRequest).toBeTruthy();

    const savedState = (deps.oauthStateStore as jest.Mocked<OAuthStateStore>).save.mock.calls[0][0];
    expect(savedState).toEqual({
      state: 'state-123',
      provider: 'google',
      codeVerifier: 'codeVerifier-abc',
      nonce: 'nonce-xyz',
      redirectUri: 'https://app.example.com/oauth/callback',
      createdAt: fixedNow,
      expiresAt: new Date(fixedNow.getTime() + 5 * 60 * 1000),
    });
    expect(result.authorizationUrl).toBe('https://accounts.google.com/auth');
  });

  it('throws when provider is not configured', async () => {
    const deps = buildDeps({ oauthProviders: {} });
    const useCase = new StartOAuth(deps);

    await expect(
      useCase.execute({
        provider: 'google',
        redirectUri: 'https://app.example.com/oauth/callback',
      })
    ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });
});
