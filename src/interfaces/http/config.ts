import type { CorsOptions } from 'cors';

export interface TokenCookieConfig {
  name: string;
  secure: boolean;
  domain?: string;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
}

export interface HttpConfig {
  tokenCookie: TokenCookieConfig;
  cors?: CorsOptions | false;
  trustProxy?: boolean;
}
