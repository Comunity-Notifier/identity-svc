import { URLSearchParams } from 'url';

import type {
  OAuthAuthorizationRequest,
  OAuthProfileRequest,
  OAuthProvider,
} from '../../application/ports/oauthProvider';
import type { OAuthProfile } from '../../application/dtos';
import { sha256Base64Url } from './base64url';

export interface GoogleOAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  scope?: string;
  fetchFn?: typeof fetch;
}

const DEFAULT_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const DEFAULT_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DEFAULT_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
const DEFAULT_SCOPE = 'openid email profile';

export class GoogleOAuthProvider implements OAuthProvider {
  readonly provider = 'google';

  private readonly fetchFn: typeof fetch;

  constructor(private readonly config: GoogleOAuthProviderConfig) {
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
    if (!this.fetchFn) {
      throw new Error('fetch API is required for GoogleOAuthProvider');
    }
  }

  buildAuthorizationUrl({
    redirectUri,
    state,
    codeVerifier,
    nonce,
  }: OAuthAuthorizationRequest): Promise<string> {
    const codeChallenge = sha256Base64Url(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scope ?? DEFAULT_SCOPE,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
    });

    if (nonce) {
      params.set('nonce', nonce);
    }

    return Promise.resolve(
      `${this.config.authorizationEndpoint ?? DEFAULT_AUTH_ENDPOINT}?${params.toString()}`
    );
  }

  async getProfile(request: OAuthProfileRequest): Promise<OAuthProfile> {
    const tokenResponse = await this.fetchFn(this.config.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: request.code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: request.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: request.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code with Google');
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new Error('Google token response missing access_token');
    }

    const userResponse = await this.fetchFn(
      this.config.userInfoEndpoint ?? DEFAULT_USERINFO_ENDPOINT,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Google user profile');
    }

    const userJson = (await userResponse.json()) as GoogleUserInfo;

    return {
      provider: 'google',
      providerUserId: userJson.sub,
      email: userJson.email,
      emailVerified: userJson.email_verified,
      name: userJson.name ?? userJson.email ?? undefined,
    };
  }
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}
