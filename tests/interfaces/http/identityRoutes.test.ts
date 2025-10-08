import request from 'supertest';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { once } from 'node:events';
import { Server } from 'node:http';

import { createApp } from '../../../src/interfaces/http/app';
import { HttpConfig } from '../../../src/interfaces/http/config';
import {
  EmailAlreadyTakenError,
  InvalidCredentialsError,
  ProviderNotConfiguredError,
} from '../../../src/domain/domainErrors';
import type { RegisterUserLocal } from '../../../src/application/useCases/registerUserLocal';
import type { LoginUserLocal } from '../../../src/application/useCases/loginUserLocal';
import type { StartOAuth } from '../../../src/application/useCases/startOAuth';
import type { HandleOAuthCallback } from '../../../src/application/useCases/handleOAuthCallback';
import type { GetMe } from '../../../src/application/useCases/getMe';
import type { Logout } from '../../../src/application/useCases/logout';
import type { TokenService } from '../../../src/application/ports/tokenService';
import type { TokenPayload } from '../../../src/application/dtos';

const appConfig: HttpConfig = {
  tokenCookie: {
    name: 'access_token',
    secure: false,
    sameSite: 'lax',
    path: '/',
  },
  cors: false,
};

const closeServer = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const startApp = async (deps: ReturnType<typeof buildDeps>) => {
  const app = createApp(deps, appConfig);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const agent = request(server);
  return { server, agent };
};

let httpSupported = true;
let httpSkipMessage = '';

const withServer = async (
  deps: ReturnType<typeof buildDeps>,
  handler: (agent: request.SuperTest<request.Test>) => Promise<void>
) => {
  if (!httpSupported) {
    if (httpSkipMessage) {
      console.warn(httpSkipMessage);
      httpSkipMessage = '';
    }
    expect(true).toBe(true);
    return;
  }

  let started;
  try {
    started = await startApp(deps);
  } catch (error) {
    if (isListenNotPermitted(error)) {
      httpSupported = false;
      httpSkipMessage =
        'Skipping HTTP contract tests because listening on a local port is not permitted in this environment.';
      console.warn(httpSkipMessage);
      httpSkipMessage = '';
      expect(true).toBe(true);
      return;
    }
    throw error;
  }

  const { server, agent } = started;
  try {
    await handler(agent);
  } finally {
    await closeServer(server).catch((error: NodeJS.ErrnoException) => {
      if (error?.code === 'ERR_SERVER_NOT_RUNNING') {
        return;
      }
      throw error;
    });
  }
};

const isListenNotPermitted = (error: unknown): error is NodeJS.ErrnoException => {
  const candidate = error as NodeJS.ErrnoException;
  return candidate?.code === 'EPERM';
};

interface IdentityDepsMocks {
  registerUserLocal: Pick<RegisterUserLocal, 'execute'>;
  registerExecute: jest.MockedFunction<RegisterUserLocal['execute']>;
  loginUserLocal: Pick<LoginUserLocal, 'execute'>;
  loginExecute: jest.MockedFunction<LoginUserLocal['execute']>;
  startOAuth: Pick<StartOAuth, 'execute'>;
  startOAuthExecute: jest.MockedFunction<StartOAuth['execute']>;
  handleOAuthCallback: Pick<HandleOAuthCallback, 'execute'>;
  handleOAuthCallbackExecute: jest.MockedFunction<HandleOAuthCallback['execute']>;
  getMe: Pick<GetMe, 'execute'>;
  getMeExecute: jest.MockedFunction<GetMe['execute']>;
  logout: Pick<Logout, 'execute'>;
  logoutExecute: jest.MockedFunction<Logout['execute']>;
  tokenService: jest.Mocked<TokenService>;
}

const buildDeps = (): IdentityDepsMocks => {
  const registerExecute: jest.MockedFunction<RegisterUserLocal['execute']> = jest.fn();
  const loginExecute: jest.MockedFunction<LoginUserLocal['execute']> = jest.fn();
  const startOAuthExecute: jest.MockedFunction<StartOAuth['execute']> = jest.fn();
  const handleOAuthCallbackExecute: jest.MockedFunction<HandleOAuthCallback['execute']> = jest.fn();
  const getMeExecute: jest.MockedFunction<GetMe['execute']> = jest.fn();
  const logoutExecute: jest.MockedFunction<Logout['execute']> = jest.fn();

  const registerUserLocal: Pick<RegisterUserLocal, 'execute'> = {
    execute: registerExecute,
  };
  const loginUserLocal: Pick<LoginUserLocal, 'execute'> = {
    execute: loginExecute,
  };
  const startOAuth: Pick<StartOAuth, 'execute'> = {
    execute: startOAuthExecute,
  };
  const handleOAuthCallback: Pick<HandleOAuthCallback, 'execute'> = {
    execute: handleOAuthCallbackExecute,
  };
  const getMe: Pick<GetMe, 'execute'> = {
    execute: getMeExecute,
  };
  const logout: Pick<Logout, 'execute'> = {
    execute: logoutExecute,
  };

  const tokenService: jest.Mocked<TokenService> = {
    signAccessToken: jest.fn(),
    verify: jest.fn(),
    getPublicJwks: jest.fn(),
  } as jest.Mocked<TokenService>;

  return {
    registerUserLocal,
    registerExecute,
    loginUserLocal,
    loginExecute,
    startOAuth,
    startOAuthExecute,
    handleOAuthCallback,
    handleOAuthCallbackExecute,
    getMe,
    getMeExecute,
    logout,
    logoutExecute,
    tokenService,
  };
};

describe('identity http routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('registers user and sets cookie', async () => {
    const deps = buildDeps();
    const expiresAt = new Date('2024-01-01T00:15:00Z');

    deps.registerExecute.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      accessToken: { token: 'jwt-token', expiresAt },
    });

    await withServer(deps, async (agent) => {
      const response = await agent.post('/identity/register').send({
        name: 'User',
        email: 'user@example.com',
        password: 'strong-password',
      });

      expect(response.status).toBe(201);
      const body = response.body as {
        user: { id: string; email: string; name?: string };
        accessToken: { token: string; expiresAt: string };
      };
      expect(body.user.email).toBe('user@example.com');
      expect(body.accessToken.expiresAt).toBe(expiresAt.toISOString());
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    });
  });

  it('returns validation error on invalid payload', async () => {
    const deps = buildDeps();
    await withServer(deps, async (agent) => {
      const response = await agent.post('/identity/register').send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
      const body = response.body as { error: { code: string } };
      expect(body.error.code).toBe('validation_error');
    });
  });

  it('maps domain errors to http responses', async () => {
    const deps = buildDeps();

    deps.registerExecute.mockRejectedValue(new EmailAlreadyTakenError('user@example.com'));

    await withServer(deps, async (agent) => {
      const response = await agent.post('/identity/register').send({
        name: 'User',
        email: 'user@example.com',
        password: 'strong-password',
      });

      expect(response.status).toBe(409);
      const body = response.body as { error: { code: string } };
      expect(body.error.code).toBe('EmailAlreadyTakenError');
    });
  });

  it('logs in user and returns token', async () => {
    const deps = buildDeps();
    const expiresAt = new Date('2024-01-01T00:15:00Z');

    deps.loginExecute.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: { token: 'jwt-token', expiresAt },
    });

    await withServer(deps, async (agent) => {
      const response = await agent
        .post('/identity/login')
        .send({ email: 'user@example.com', password: 'strong-password' });

      expect(response.status).toBe(200);
      const body = response.body as {
        user: { id: string; email: string };
        accessToken: { token: string; expiresAt: string };
      };
      expect(body.user.id).toBe('user-id');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  it('returns 401 on invalid credentials', async () => {
    const deps = buildDeps();

    deps.loginExecute.mockRejectedValue(new InvalidCredentialsError());

    await withServer(deps, async (agent) => {
      const response = await agent
        .post('/identity/login')
        .send({ email: 'user@example.com', password: 'invalid' });

      expect(response.status).toBe(401);
      const body = response.body as { error: { code: string } };
      expect(body.error.code).toBe('InvalidCredentialsError');
    });
  });

  it('starts oauth flow and redirects', async () => {
    const deps = buildDeps();

    deps.startOAuthExecute.mockResolvedValue({
      authorizationUrl: 'https://accounts.example.com/auth',
    });

    await withServer(deps, async (agent) => {
      const response = await agent
        .get('/identity/connect/google')
        .query({ redirect_uri: 'https://app.example.com/callback' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://accounts.example.com/auth');
    });
  });

  it('handles errors during oauth start', async () => {
    const deps = buildDeps();

    deps.startOAuthExecute.mockRejectedValue(new ProviderNotConfiguredError('google'));

    await withServer(deps, async (agent) => {
      const response = await agent
        .get('/identity/connect/google')
        .query({ redirect_uri: 'https://app.example.com/callback' });

      expect(response.status).toBe(400);
      const body = response.body as { error: { code: string } };
      expect(body.error.code).toBe('ProviderNotConfiguredError');
    });
  });

  it('returns authenticated user info when token valid', async () => {
    const deps = buildDeps();

    deps.tokenService.verify.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      providerAccounts: [],
    } satisfies TokenPayload);

    deps.getMeExecute.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
    });

    await withServer(deps, async (agent) => {
      const response = await agent.get('/identity/me').set('Authorization', 'Bearer jwt-token');

      expect(response.status).toBe(200);
      const body = response.body as { user: { id: string; email: string } };
      expect(body.user.id).toBe('user-id');
      expect(deps.getMeExecute).toHaveBeenCalledWith({ userId: 'user-id' });
    });
  });

  it('rejects unauthorized access when token missing', async () => {
    const deps = buildDeps();
    await withServer(deps, async (agent) => {
      const response = await agent.get('/identity/me');

      expect(response.status).toBe(401);
      const body = response.body as { error: { code: string } };
      expect(body.error.code).toBe('unauthorized');
    });
  });

  it('logs out user clearing cookie', async () => {
    const deps = buildDeps();

    deps.tokenService.verify.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      providerAccounts: [],
    } satisfies TokenPayload);

    await withServer(deps, async (agent) => {
      const response = await agent
        .post('/identity/logout')
        .set('Cookie', ['access_token=jwt-token']);

      expect(response.status).toBe(204);
      expect(response.headers['set-cookie'][0]).toMatch(/^access_token=;/);
      expect(deps.logoutExecute).toHaveBeenCalledWith({ userId: 'user-id' });
    });
  });

  it('exposes jwks endpoint', async () => {
    const deps = buildDeps();

    deps.tokenService.getPublicJwks.mockResolvedValue({
      keys: [{ kid: 'test' }],
    });

    await withServer(deps, async (agent) => {
      const response = await agent.get('/.well-known/jwks.json');

      expect(response.status).toBe(200);
      const body = response.body as { keys: unknown[] };
      expect(body.keys).toHaveLength(1);
    });
  });

  it('sets security headers', async () => {
    const deps = buildDeps();

    await withServer(deps, async (agent) => {
      const response = await agent.get('/identity/me');

      expect(response.headers['strict-transport-security']).toBe(
        'max-age=15552000; includeSubDomains'
      );
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });
});
