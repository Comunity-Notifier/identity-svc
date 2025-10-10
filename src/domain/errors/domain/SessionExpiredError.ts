import { DomainError } from '../DomainError';

export class SessionExpiredError extends DomainError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} has expired`);
  }
}
