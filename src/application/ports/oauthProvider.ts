import { OAuthProfile } from '../dtos';

export interface OAuthAuthorizationRequest {
  redirectUri: string;
  state: string;
  codeVerifier: string;
  nonce?: string;
}

export interface OAuthProfileRequest {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface OAuthProvider {
  readonly provider: string;
  buildAuthorizationUrl(params: OAuthAuthorizationRequest): Promise<string>;
  getProfile(params: OAuthProfileRequest): Promise<OAuthProfile>;
}
