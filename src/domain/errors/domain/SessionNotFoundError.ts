import { DomainError } from '../DomainError';

export class SessionNotFoundError extends DomainError {
  constructor(sessionToken: string) {
    super(`Session not found: ${sessionToken}`);
  }
}
