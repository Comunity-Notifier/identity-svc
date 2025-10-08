import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { HttpConfig } from './config';
import { createIdentityRouter } from './routes/identity';
import { asyncHandler, errorHandler } from './errors';
import type { RegisterUserLocal } from '../../application/useCases/registerUserLocal';
import type { LoginUserLocal } from '../../application/useCases/loginUserLocal';
import type { StartOAuth } from '../../application/useCases/startOAuth';
import type { HandleOAuthCallback } from '../../application/useCases/handleOAuthCallback';
import type { GetMe } from '../../application/useCases/getMe';
import type { Logout } from '../../application/useCases/logout';
import type { TokenService } from '../../application/ports/tokenService';

type RegisterUserLocalPort = Pick<RegisterUserLocal, 'execute'>;
type LoginUserLocalPort = Pick<LoginUserLocal, 'execute'>;
type StartOAuthPort = Pick<StartOAuth, 'execute'>;
type HandleOAuthCallbackPort = Pick<HandleOAuthCallback, 'execute'>;
type GetMePort = Pick<GetMe, 'execute'>;
type LogoutPort = Pick<Logout, 'execute'>;

interface IdentityDeps {
  registerUserLocal: RegisterUserLocalPort;
  loginUserLocal: LoginUserLocalPort;
  startOAuth: StartOAuthPort;
  handleOAuthCallback: HandleOAuthCallbackPort;
  getMe: GetMePort;
  logout: LogoutPort;
  tokenService: TokenService;
}

export type AppDeps = IdentityDeps;

export const createApp = (deps: AppDeps, config: HttpConfig) => {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());

  if (config.cors !== false) {
    app.use(cors(config.cors ?? { origin: true, credentials: true }));
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use('/identity', createIdentityRouter(deps, config));

  app.get(
    '/.well-known/jwks.json',
    asyncHandler(async (_req, res) => {
      const jwks = await deps.tokenService.getPublicJwks();
      res.status(200).json(jwks);
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Route not found',
      },
    });
  });

  app.use(errorHandler);

  return app;
};
