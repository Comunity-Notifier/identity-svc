import { CookieOptions, Router, Response } from 'express';
import { asyncHandler } from '../errors';
import { httpConfig } from '../config';
import { createSuccessResponse } from '../api-response';
import {
  type LoginLocalResponseDto,
  loginSchema,
  registerSchema,
} from '../validators/identity-schema';
import { LoginLocal } from '../../application/use-cases/LoginLocal';
import { RegisterAndLoginLocal } from '../../application/use-cases/RegisterAndLoginLocal';

interface IdentityRouterDeps {
  loginLocal: Pick<LoginLocal, 'execute'>;
  registerAndLoginLocal: Pick<RegisterAndLoginLocal, 'execute'>;
}

export const createIdentityRouter = (deps: IdentityRouterDeps): Router => {
  const router = Router();

  router.post('/register', async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await deps.registerAndLoginLocal.execute(body);
    setAccessTokenCookie(res, result.accessToken, new Date(Date.now() + 7 * 60 * 60 * 1000));
    res.status(201).end();
  });

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const { accessToken, ...rest } = await deps.loginLocal.execute(body);
      setAccessTokenCookie(res, accessToken, new Date(Date.now() + 7 * 60 * 60 * 1000));

      const response = createSuccessResponse<LoginLocalResponseDto>(rest);
      res.status(200).json(response);
    })
  );

  router.post('/logout', (_, res) => {
    res.clearCookie(httpConfig.tokenCookie.name, {
      httpOnly: true,
      secure: httpConfig.tokenCookie.secure,
      domain: httpConfig.tokenCookie.domain,
      sameSite: httpConfig.tokenCookie.sameSite ?? 'lax',
      path: httpConfig.tokenCookie.path ?? '/',
    });

    res.status(204);
  });

  return router;
};

const setAccessTokenCookie = (res: Response, token: string, expiresAt: Date) => {
  const cookieConfig = buildCookieConfig(expiresAt);
  res.cookie(httpConfig.tokenCookie.name, token, cookieConfig);
};

const buildCookieConfig = (expiresAt: Date): CookieOptions => ({
  httpOnly: true,
  secure: httpConfig.tokenCookie.secure,
  domain: httpConfig.tokenCookie.domain,
  sameSite: httpConfig.tokenCookie.sameSite ?? 'lax',
  path: httpConfig.tokenCookie.path ?? '/',
  expires: expiresAt,
});
