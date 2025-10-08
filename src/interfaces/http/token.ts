import type { Request } from 'express';

export const getTokenFromRequest = (req: Request, cookieName: string): string | null => {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.slice(7);
  }

  const cookies = req.cookies as Record<string, unknown> | undefined;
  const cookieToken = cookies?.[cookieName];
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken;
  }

  return null;
};
