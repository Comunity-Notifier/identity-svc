import type { CorsOptions } from 'cors';
import { TokenConfig } from 'src/infrastructure/services/JwtTokenService';

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

let jwtSecret: string;

if (process.env.NODE_ENV === 'Production' && !process.env.JWT_SECRET) {
  throw new Error('❌  El secreto de JWT debe estar definido en producción.');
} else {
  jwtSecret = process.env.JWT_SECRET ?? 'token_secret';
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  The JWT secret is undefined. A default insecure value is being used.');
  }
}

export const tokenConfig: TokenConfig = {
  secret: jwtSecret,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};
