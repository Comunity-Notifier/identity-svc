export interface TokenPayload {
  sub: string;
  email: string;
}

export interface TokenService {
  signAccessToken(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
