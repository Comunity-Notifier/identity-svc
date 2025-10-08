import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { GoogleOAuthProvider } from '../../../src/infrastructure/oauth/googleProvider';

const config = {
  clientId: 'google-client-id',
  clientSecret: 'google-client-secret',
  authorizationEndpoint: 'https://accounts.example.com/auth',
  tokenEndpoint: 'https://accounts.example.com/token',
  userInfoEndpoint: 'https://accounts.example.com/userinfo',
};

describe('GoogleOAuthProvider', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('builds authorization url with PKCE and nonce', async () => {
    const provider = new GoogleOAuthProvider({
      ...config,
      fetchFn: fetchMock,
    });

    const url = await provider.buildAuthorizationUrl({
      redirectUri: 'https://app.example.com/callback',
      state: 'state-123',
      codeVerifier: 'verifier',
      nonce: 'nonce-1',
    });

    expect(url).toContain('client_id=google-client-id');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
    expect(url).toContain('state=state-123');
    expect(url).toContain('nonce=nonce-1');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
  });

  it('exchanges code and returns oauth profile', async () => {
    const provider = new GoogleOAuthProvider({
      ...config,
      fetchFn: fetchMock,
    });

    fetchMock.mockResolvedValueOnce(createFetchResponse(200, { access_token: 'token-123' }));

    fetchMock.mockResolvedValueOnce(
      createFetchResponse(200, {
        sub: 'google-user',
        email: 'user@example.com',
        email_verified: true,
        name: 'User Example',
      })
    );

    const profile = await provider.getProfile({
      code: 'code-123',
      codeVerifier: 'verifier',
      redirectUri: 'https://app.example.com/callback',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://accounts.example.com/token',
      expect.objectContaining({ method: 'POST' })
    );

    const init = (fetchMock.mock.calls[0][1] ?? {}) as Record<string, unknown>;
    const body = (init.body ?? '') as string;
    expect(body).toContain('code=code-123');
    expect(body).toContain('code_verifier=verifier');

    expect(profile.provider).toBe('google');
    expect(profile.providerUserId).toBe('google-user');
    expect(profile.email).toBe('user@example.com');
    expect(profile.emailVerified).toBe(true);
    expect(profile.name).toBe('User Example');
  });
});

function createFetchResponse(status: number, json: unknown): Response {
  return new Response(JSON.stringify(json), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
