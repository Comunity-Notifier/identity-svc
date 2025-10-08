import { AccessToken, TokenPayload } from '../dtos';

export interface TokenService {
  signAccessToken(payload: TokenPayload): Promise<AccessToken>;
  verify(token: string): Promise<TokenPayload>;
  getPublicJwks(): Promise<unknown>;
}
