export interface TokenPayload {
  sub: string;
  email: string;
}

export interface SignedTokenResult {
  token: string;
  expiresAt: Date;
}

export interface TokenService {
  signAccessToken(payload: TokenPayload): SignedTokenResult;
  verify(token: string): TokenPayload;
}
