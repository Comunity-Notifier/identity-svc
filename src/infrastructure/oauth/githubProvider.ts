import { URLSearchParams } from 'url';

import type {
  OAuthAuthorizationRequest,
  OAuthProfileRequest,
  OAuthProvider,
} from '../../application/ports/oauthProvider';
import type { OAuthProfile } from '../../application/dtos';
import { sha256Base64Url } from './base64url';

export interface GitHubOAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userEndpoint?: string;
  emailEndpoint?: string;
  scope?: string;
  fetchFn?: typeof fetch;
}

const DEFAULT_AUTH_ENDPOINT = 'https://github.com/login/oauth/authorize';
const DEFAULT_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const DEFAULT_USER_ENDPOINT = 'https://api.github.com/user';
const DEFAULT_EMAIL_ENDPOINT = 'https://api.github.com/user/emails';
const DEFAULT_SCOPE = 'read:user user:email';

export class GitHubOAuthProvider implements OAuthProvider {
  readonly provider = 'github';

  private readonly fetchFn: typeof fetch;

  constructor(private readonly config: GitHubOAuthProviderConfig) {
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
    if (!this.fetchFn) {
      throw new Error('fetch API is required for GitHubOAuthProvider');
    }
  }

  buildAuthorizationUrl({
    redirectUri,
    state,
    codeVerifier,
  }: OAuthAuthorizationRequest): Promise<string> {
    const codeChallenge = sha256Base64Url(codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scope ?? DEFAULT_SCOPE,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return Promise.resolve(
      `${this.config.authorizationEndpoint ?? DEFAULT_AUTH_ENDPOINT}?${params.toString()}`
    );
  }

  async getProfile(request: OAuthProfileRequest): Promise<OAuthProfile> {
    const tokenResponse = await this.fetchFn(this.config.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: request.code,
        redirect_uri: request.redirectUri,
        code_verifier: request.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code with GitHub');
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new Error('GitHub token response missing access_token');
    }

    const user = await this.fetchUser(tokenJson.access_token);
    const primaryEmail = user.email ?? (await this.fetchPrimaryEmail(tokenJson.access_token));

    return {
      provider: 'github',
      providerUserId: user.id?.toString() ?? '',
      email: primaryEmail ?? undefined,
      name: user.name ?? user.login ?? primaryEmail ?? undefined,
      emailVerified: Boolean(primaryEmail),
    };
  }

  private async fetchUser(accessToken: string): Promise<GitHubUserResponse> {
    const response = await this.fetchFn(this.config.userEndpoint ?? DEFAULT_USER_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user profile');
    }

    return (await response.json()) as GitHubUserResponse;
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await this.fetchFn(this.config.emailEndpoint ?? DEFAULT_EMAIL_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub email addresses');
    }

    const emails = (await response.json()) as GitHubEmailResponse[];
    const primary = emails.find((email) => email.primary && email.verified);
    const fallback = emails.find((email) => email.verified);

    return (primary ?? fallback)?.email ?? null;
  }
}

interface GitHubUserResponse {
  id: number;
  login?: string;
  email?: string | null;
  name?: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}
