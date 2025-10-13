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

export const httpConfig: HttpConfig = {
  tokenCookie: {
    name: process.env.ACCESS_TOKEN_COOKIE_NAME ?? 'access_token',
    secure: (process.env.NODE_ENV ?? 'development') !== 'development',
    domain: process.env.COOKIE_DOMAIN,
    path: process.env.COOKIE_PATH ?? '/',
    sameSite: (process.env.COOKIE_SAMESITE?.toLowerCase() as 'lax' | 'strict' | 'none') ?? 'lax',
  },
  cors: process.env.CORS_DISABLED
    ? false
    : {
        origin: process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) ?? true,
        credentials: true,
      },
  trustProxy: process.env.TRUST_PROXY === 'true',
};
