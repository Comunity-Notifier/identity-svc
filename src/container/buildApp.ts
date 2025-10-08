import type { Express } from 'express';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';
import type { JWK } from 'jose';

import { createApp } from '../interfaces/http/app';
import { HttpConfig } from '../interfaces/http/config';
import { Argon2PasswordHasher, TokenServiceJose } from '../infrastructure/crypto';
import {
  AccountRepositoryPrisma,
  OAuthStateStorePrisma,
  UserRepositoryPrisma,
} from '../infrastructure/persistence/prisma';
import { RegisterUserLocal } from '../application/useCases/registerUserLocal';
import { LoginUserLocal } from '../application/useCases/loginUserLocal';
import { StartOAuth } from '../application/useCases/startOAuth';
import { HandleOAuthCallback } from '../application/useCases/handleOAuthCallback';
import { GetMe } from '../application/useCases/getMe';
import { Logout } from '../application/useCases/logout';
import type { TokenService } from '../application/ports/tokenService';
import type { PasswordHasher } from '../application/ports/passwordHasher';
import type { OAuthProvider } from '../application/ports/oauthProvider';
import { GitHubOAuthProvider, GoogleOAuthProvider } from '../infrastructure/oauth';

export interface BuildAppOverrides {
  prisma?: PrismaClient;
  tokenService?: TokenService;
  passwordHasher?: PasswordHasher;
  httpConfig?: HttpConfig;
  oauthProviders?: Record<string, OAuthProvider>;
}

export interface AppInstance {
  app: Express;
  shutdown: () => Promise<void>;
  prisma: PrismaClient;
  tokenService: TokenService;
}

export const buildApp = async (overrides: BuildAppOverrides = {}): Promise<AppInstance> => {
  const prisma = overrides.prisma ?? new PrismaClient();
  const ownsPrisma = !overrides.prisma;

  const tokenService =
    overrides.tokenService ??
    (await TokenServiceJose.create({
      privateKeyJwk: parsePrivateJwk(),
      algorithm: requiredEnv('JWT_ALGORITHM', 'EdDSA'),
      issuer: requiredEnv('JWT_ISSUER'),
      audience: requiredEnv('JWT_AUDIENCE'),
      accessTokenTtlMs: Number(process.env.JWT_TTL_MS ?? 15 * 60 * 1000),
    }));

  const passwordHasher = overrides.passwordHasher ?? new Argon2PasswordHasher();

  const userRepository = new UserRepositoryPrisma(prisma);
  const accountRepository = new AccountRepositoryPrisma(prisma);
  const oauthStateStore = new OAuthStateStorePrisma(prisma);

  const registerUserLocal = new RegisterUserLocal({
    userRepository,
    passwordHasher,
    tokenService,
  });

  const loginUserLocal = new LoginUserLocal({
    userRepository,
    passwordHasher,
    tokenService,
  });

  const oauthProviders = overrides.oauthProviders ?? buildOAuthProviders();

  const startOAuth = new StartOAuth({
    oauthStateStore,
    oauthProviders,
  });

  const handleOAuthCallback = new HandleOAuthCallback({
    oauthStateStore,
    oauthProviders,
    accountRepository,
    userRepository,
    tokenService,
  });

  const getMe = new GetMe({ userRepository });
  const logout = new Logout();

  const httpConfig = overrides.httpConfig ?? buildHttpConfig();

  const app = createApp(
    {
      registerUserLocal,
      loginUserLocal,
      startOAuth,
      handleOAuthCallback,
      getMe,
      logout,
      tokenService,
    },
    httpConfig
  );

  return {
    app,
    tokenService,
    prisma,
    shutdown: async () => {
      if (ownsPrisma) {
        await prisma.$disconnect();
      }
    },
  };
};

const buildHttpConfig = (): HttpConfig => ({
  tokenCookie: {
    name: process.env.ACCESS_TOKEN_COOKIE_NAME ?? 'access_token',
    secure: (process.env.NODE_ENV ?? 'development') !== 'development',
    domain: process.env.COOKIE_DOMAIN,
    path: process.env.COOKIE_PATH ?? '/',
    sameSite: (process.env.COOKIE_SAMESITE?.toLowerCase() as 'lax' | 'strict' | 'none') ?? 'lax',
  },
  cors:
    process.env.CORS_DISABLED === 'true'
      ? false
      : {
          origin: process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) ?? true,
          credentials: true,
        },
  trustProxy: process.env.TRUST_PROXY === 'true',
});

const buildOAuthProviders = (): Record<string, OAuthProvider> => {
  const providers: Record<string, OAuthProvider> = {};

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    providers.google = new GoogleOAuthProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationEndpoint: process.env.GOOGLE_AUTH_URL,
      tokenEndpoint: process.env.GOOGLE_TOKEN_URL,
      userInfoEndpoint: process.env.GOOGLE_USERINFO_URL,
      scope: process.env.GOOGLE_SCOPE,
    });
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (githubClientId && githubClientSecret) {
    providers.github = new GitHubOAuthProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      authorizationEndpoint: process.env.GITHUB_AUTH_URL,
      tokenEndpoint: process.env.GITHUB_TOKEN_URL,
      userEndpoint: process.env.GITHUB_USER_URL,
      emailEndpoint: process.env.GITHUB_EMAIL_URL,
      scope: process.env.GITHUB_SCOPE,
    });
  }

  return providers;
};

const parsePrivateJwk = (): JWK => {
  const jwkRaw = requiredEnv('JWT_PRIVATE_KEY');
  let parsed: unknown;
  try {
    parsed = JSON.parse(jwkRaw);
  } catch (error) {
    throw new Error('JWT_PRIVATE_KEY must be a valid JWK JSON string', {
      cause: error,
    });
  }

  if (!isJsonWebKey(parsed)) {
    throw new Error('JWT_PRIVATE_KEY must be a JSON Web Key object');
  }

  return parsed;
};

const requiredEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

const isJsonWebKey = (value: unknown): value is JWK => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.kty === 'string';
};
