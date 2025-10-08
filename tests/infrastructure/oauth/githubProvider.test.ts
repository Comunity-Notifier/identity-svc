import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { GitHubOAuthProvider } from '../../../src/infrastructure/oauth/githubProvider';

const config = {
  clientId: 'github-client-id',
  clientSecret: 'github-client-secret',
  authorizationEndpoint: 'https://github.example.com/authorize',
  tokenEndpoint: 'https://github.example.com/token',
  userEndpoint: 'https://github.example.com/user',
  emailEndpoint: 'https://github.example.com/user/emails',
};

describe('GitHubOAuthProvider', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('builds authorization url with PKCE', async () => {
    const provider = new GitHubOAuthProvider({
      ...config,
      fetchFn: fetchMock,
    });

    const url = await provider.buildAuthorizationUrl({
      redirectUri: 'https://app.example.com/callback',
      state: 'state-abc',
      codeVerifier: 'github-verifier',
    });

    expect(url).toContain('client_id=github-client-id');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
    expect(url).toContain('state=state-abc');
    expect(url).toContain('code_challenge=');
  });

  it('fetches profile using user info and emails', async () => {
    const provider = new GitHubOAuthProvider({
      ...config,
      fetchFn: fetchMock,
    });

    fetchMock.mockResolvedValueOnce(createFetchResponse(200, { access_token: 'github-token' }));

    fetchMock.mockResolvedValueOnce(
      createFetchResponse(200, {
        id: 42,
        login: 'octocat',
        email: null,
        name: 'Octo Cat',
      })
    );

    fetchMock.mockResolvedValueOnce(
      createFetchResponse(200, [
        { email: 'primary@example.com', primary: true, verified: true },
        { email: 'secondary@example.com', primary: false, verified: true },
      ])
    );

    const profile = await provider.getProfile({
      code: 'code-xyz',
      codeVerifier: 'github-verifier',
      redirectUri: 'https://app.example.com/callback',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://github.example.com/token',
      expect.objectContaining({ method: 'POST' })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://github.example.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer github-token' }),
      })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://github.example.com/user/emails',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer github-token' }),
      })
    );

    expect(profile.provider).toBe('github');
    expect(profile.providerUserId).toBe('42');
    expect(profile.email).toBe('primary@example.com');
    expect(profile.name).toBe('Octo Cat');
    expect(profile.emailVerified).toBe(true);
  });
});

function createFetchResponse(status: number, json: unknown): Response {
  return new Response(JSON.stringify(json), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
