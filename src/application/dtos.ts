export interface AccessToken {
  token: string;
  expiresAt: Date;
}

export interface ProviderAccount {
  provider: string;
  providerUserId: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name?: string;
  providerAccounts: ProviderAccount[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export interface RegisterUserLocalResult {
  user: AuthenticatedUser;
  accessToken: AccessToken;
}

export interface LoginUserLocalResult {
  user: AuthenticatedUser;
  accessToken: AccessToken;
}

export interface StartOAuthCommand {
  provider: string;
  redirectUri: string;
  nonce?: boolean;
}

export interface StartOAuthResult {
  authorizationUrl: string;
}

export interface HandleOAuthCallbackCommand {
  provider: string;
  code: string;
  state: string;
}

export interface HandleOAuthCallbackResult {
  user: AuthenticatedUser;
  accessToken: AccessToken;
}

export interface GetMeQuery {
  userId: string;
}

export interface GetMeResult {
  user: AuthenticatedUser;
}

export interface LogoutCommand {
  userId: string;
}

export interface LogoutResult {
  userId: string;
}

export interface RegisterUserLocalCommand {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserLocalCommand {
  email: string;
  password: string;
}

export interface OAuthStateRecord {
  state: string;
  provider: string;
  codeVerifier: string;
  nonce?: string;
  redirectUri: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthProfile {
  provider: string;
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
}
