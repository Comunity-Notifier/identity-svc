import { CookieOptions, Router, Response } from 'express';
import { asyncHandler } from '../errors';
import { httpConfig } from '../config';
import { createSuccessResponse } from '../api-response';
import { loginSchema, registerSchema } from '../validators/identity-schema';

interface IdentityRouterDeps {}

export const createIdentityRouter = async (deps: IdentityRouterDeps): Promise<Router> => {
  const router = Router();

  router.post('/register', async (req, res) => {
    registerSchema.parse(req.body);
    //   const result = await deps.registerUserLocal.execute(body);
    // setAccessTokenCookie(res, 'result.accessToken.token', new Date());
    res.status(201).end();
  });

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      loginSchema.parse(req.body);
      //    const result = await deps.loginUserLocal.execute(body);
      setAccessTokenCookie(res, 'result.accessToken.token', new Date());
      res.status(200).json(createSuccessResponse({ id: 'uuid', email: 'email@gmail.' }));
    })
  );

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
