import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createErrorResponse } from './api-response';
import { InvalidCredentialsError } from '../domain/errors/domain/InvalidCredentialsError';
import { UserAlreadyExistsError } from '../domain/errors/domain/UserAlreadyExistsError';
import { UserNotFoundError } from '../domain/errors/domain/UserNotFoundError';
import { EmptyValueError } from '../domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from '../domain/errors/value-objects/InvalidFormatError';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
  };
}

class DomainError extends Error {}

type DomainErrorConstructor = new (...args: string[]) => DomainError;

const DOMAIN_STATUS: [DomainErrorConstructor, number][] = [
  [InvalidCredentialsError, 401],
  [UserNotFoundError, 404],
  [UserAlreadyExistsError, 409],
  [EmptyValueError, 400],
  [InvalidFormatError, 400],
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
    res
      .status(400)
      .json(
        createErrorResponse(
          'validate_error',
          error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(';')
        )
      );

    return;
  }

  if (error instanceof DomainError) {
    const status = resolveDomainStatus(error);
    res.status(status).json(createErrorResponse(error.name, error.message));
    return;
  }

  console.error('Unexpected error', error);

  res.status(500).json(createErrorResponse('internal_server_error', 'Unexpected error'));
};

const resolveDomainStatus = (error: DomainError): number => {
  for (const [type, status] of DOMAIN_STATUS) {
    if (error instanceof type) {
      return status;
    }
  }

  return 400;
};
