import { CookieOptions, Response } from 'express';
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

export class IdentityController {
  private readonly loginLocal: Pick<LoginLocal, 'execute'>;
  private readonly registerAndLoginLocal: Pick<RegisterAndLoginLocal, 'execute'>;

  constructor({ loginLocal, registerAndLoginLocal }: IdentityRouterDeps) {
    this.loginLocal = loginLocal;
    this.registerAndLoginLocal = registerAndLoginLocal;
  }

  register = asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await this.registerAndLoginLocal.execute(body);
    this.setAccessTokenCookie(res, result.accessToken, new Date(Date.now() + 7 * 60 * 60 * 1000));
    res.status(201).end();
  });

  login = asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const { accessToken, ...rest } = await this.loginLocal.execute(body);
    this.setAccessTokenCookie(res, accessToken, new Date(Date.now() + 7 * 60 * 60 * 1000));

    const response = createSuccessResponse<LoginLocalResponseDto>(rest);
    res.status(200).json(response);
  });

  logout(_: Request, res: Response) {
    res.clearCookie(httpConfig.tokenCookie.name, {
      httpOnly: true,
      secure: httpConfig.tokenCookie.secure,
      domain: httpConfig.tokenCookie.domain,
      sameSite: httpConfig.tokenCookie.sameSite ?? 'lax',
      path: httpConfig.tokenCookie.path ?? '/',
    });

    res.status(204);
  }

  private setAccessTokenCookie = (res: Response, token: string, expiresAt: Date) => {
    const cookieConfig = this.buildCookieConfig(expiresAt);
    res.cookie(httpConfig.tokenCookie.name, token, cookieConfig);
  };

  private buildCookieConfig = (expiresAt: Date): CookieOptions => ({
    httpOnly: true,
    secure: httpConfig.tokenCookie.secure,
    domain: httpConfig.tokenCookie.domain,
    sameSite: httpConfig.tokenCookie.sameSite ?? 'lax',
    path: httpConfig.tokenCookie.path ?? '/',
    expires: expiresAt,
  });
}
