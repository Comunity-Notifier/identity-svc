import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import {
  AccountAlreadyLinkedError,
  DomainError,
  EmailAlreadyTakenError,
  InvalidCredentialsError,
  OAuthProfileEmailRequiredError,
  OAuthStateExpiredError,
  ProviderNotConfiguredError,
  UserNotFoundError,
} from '../../domain/domainErrors';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
  };
}

type DomainErrorConstructor = new (...args: string[]) => DomainError;

const DOMAIN_STATUS: [DomainErrorConstructor, number][] = [
  [EmailAlreadyTakenError, 409],
  [AccountAlreadyLinkedError, 409],
  [InvalidCredentialsError, 401],
  [OAuthStateExpiredError, 400],
  [OAuthProfileEmailRequiredError, 400],
  [ProviderNotConfiguredError, 400],
  [UserNotFoundError, 404],
];

export const asyncHandler =
  <T extends Request, U extends Response>(handler: (req: T, res: U) => Promise<void>) =>
  (req: T, res: U, next: NextFunction) => {
    handler(req, res).catch(next);
  };

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response<ErrorResponseBody>,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: error.issues.map((issue) => issue.message).join('; '),
      },
    });
    return;
  }

  if (error instanceof DomainError) {
    const status = resolveDomainStatus(error);
    res.status(status).json({
      error: {
        code: error.name,
        message: error.message,
      },
    });
    return;
  }

  console.error('Unexpected error', error);

  res.status(500).json({
    error: {
      code: 'internal_server_error',
      message: 'Unexpected error',
    },
  });
};

const resolveDomainStatus = (error: DomainError): number => {
  for (const [type, status] of DOMAIN_STATUS) {
    if (error instanceof type) {
      return status;
    }
  }

  return 400;
};
