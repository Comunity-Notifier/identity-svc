import { Router, type CookieOptions, type Request, type Response } from 'express';

import type { RegisterUserLocal } from '../../../application/useCases/registerUserLocal';
import type { LoginUserLocal } from '../../../application/useCases/loginUserLocal';
import type { StartOAuth } from '../../../application/useCases/startOAuth';
import type { HandleOAuthCallback } from '../../../application/useCases/handleOAuthCallback';
import type { GetMe } from '../../../application/useCases/getMe';
import type { Logout } from '../../../application/useCases/logout';
import type { TokenService } from '../../../application/ports/tokenService';
import type { TokenPayload } from '../../../application/dtos';
import { asyncHandler } from '../errors';
import {
  handleOAuthCallbackSchema,
  loginSchema,
  registerSchema,
  startOAuthSchema,
} from '../validators/identitySchemas';
import { HttpConfig } from '../config';
import { getTokenFromRequest } from '../token';

type RegisterUserLocalPort = Pick<RegisterUserLocal, 'execute'>;
type LoginUserLocalPort = Pick<LoginUserLocal, 'execute'>;
type StartOAuthPort = Pick<StartOAuth, 'execute'>;
type HandleOAuthCallbackPort = Pick<HandleOAuthCallback, 'execute'>;
type GetMePort = Pick<GetMe, 'execute'>;
type LogoutPort = Pick<Logout, 'execute'>;

interface IdentityRouterDeps {
  registerUserLocal: RegisterUserLocalPort;
  loginUserLocal: LoginUserLocalPort;
  startOAuth: StartOAuthPort;
  handleOAuthCallback: HandleOAuthCallbackPort;
  getMe: GetMePort;
  logout: LogoutPort;
  tokenService: TokenService;
}

export const createIdentityRouter = (deps: IdentityRouterDeps, config: HttpConfig): Router => {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const body = registerSchema.parse(req.body);
      const result = await deps.registerUserLocal.execute(body);
      setAccessTokenCookie(res, result.accessToken.token, result.accessToken.expiresAt, config);
      res.status(201).json({
        user: result.user,
        accessToken: serializeAccessToken(result.accessToken),
      });
    })
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const result = await deps.loginUserLocal.execute(body);
      setAccessTokenCookie(res, result.accessToken.token, result.accessToken.expiresAt, config);
      res.status(200).json({
        user: result.user,
        accessToken: serializeAccessToken(result.accessToken),
      });
    })
  );

  router.get(
    '/connect/:provider',
    asyncHandler(async (req, res) => {
      const query = startOAuthSchema.parse(req.query);
      const result = await deps.startOAuth.execute({
        provider: req.params.provider,
        redirectUri: query.redirect_uri,
        nonce: query.nonce,
      });

      res.redirect(302, result.authorizationUrl);
    })
  );

  router.get(
    '/callback/:provider',
    asyncHandler(async (req, res) => {
      const query = handleOAuthCallbackSchema.parse(req.query);
      const result = await deps.handleOAuthCallback.execute({
        provider: req.params.provider,
        code: query.code,
        state: query.state,
      });

      setAccessTokenCookie(res, result.accessToken.token, result.accessToken.expiresAt, config);
      res.status(200).json({
        user: result.user,
        accessToken: serializeAccessToken(result.accessToken),
      });
    })
  );

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const payload = await requireTokenPayload(req, res, deps.tokenService, config);
      if (!payload) {
        return;
      }

      const result = await deps.getMe.execute({ userId: payload.sub });
      res.status(200).json(result);
    })
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const payload = await requireTokenPayload(req, res, deps.tokenService, config);
      if (!payload) {
        return;
      }

      deps.logout.execute({ userId: payload.sub });
      clearAccessTokenCookie(res, config);
      res.status(204).send();
    })
  );

  return router;
};

const setAccessTokenCookie = (
  res: Response,
  token: string,
  expiresAt: Date,
  config: HttpConfig
) => {
  const cookieConfig = buildCookieConfig(config, expiresAt);
  res.cookie(config.tokenCookie.name, token, cookieConfig);
};

const clearAccessTokenCookie = (res: Response, config: HttpConfig) => {
  res.clearCookie(config.tokenCookie.name, {
    httpOnly: true,
    sameSite: config.tokenCookie.sameSite ?? 'lax',
    secure: config.tokenCookie.secure,
    domain: config.tokenCookie.domain,
    path: config.tokenCookie.path ?? '/',
  });
};

const buildCookieConfig = (config: HttpConfig, expiresAt: Date): CookieOptions => ({
  httpOnly: true,
  secure: config.tokenCookie.secure,
  domain: config.tokenCookie.domain,
  sameSite: config.tokenCookie.sameSite ?? 'lax',
  path: config.tokenCookie.path ?? '/',
  expires: expiresAt,
});

const serializeAccessToken = (accessToken: { token: string; expiresAt: Date }) => ({
  token: accessToken.token,
  expiresAt: accessToken.expiresAt.toISOString(),
});

const requireTokenPayload = async (
  req: Request,
  res: Response,
  tokenService: TokenService,
  config: HttpConfig
): Promise<TokenPayload | null> => {
  const token = getTokenFromRequest(req, config.tokenCookie.name);
  if (!token) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing access token',
      },
    });
    return null;
  }

  try {
    return await tokenService.verify(token);
  } catch {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid or expired access token',
      },
    });
    return null;
  }
};
