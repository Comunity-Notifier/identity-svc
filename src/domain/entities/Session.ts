import { SessionExpiredError } from '../errors/domain/SessionExpiredError';
import { Id } from '../value-objects/Id';
import { Token } from '../value-objects/Token';
import { ExpiresAt } from '../value-objects/ExpiresAt';
import { UserAgent } from '../value-objects/UserAgent';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt ';

export interface SessionProps {
  id: Id;
  userId: Id;
  token: Token;
  expiresAt: ExpiresAt;
  userAgent: UserAgent;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export class Session {
  constructor(private readonly props: SessionProps) {}

  isExpired(): boolean {
    return this.props.expiresAt.isBefore(new Date());
  }

  renew(expiration: ExpiresAt, token: Token): void {
    if (this.isExpired()) {
      throw new SessionExpiredError(this.props.id.toString());
    }
    this.props.expiresAt = expiration;
    this.props.token = token;
    this.props.updatedAt = new UpdatedAt(new Date());
  }

  revoke(): void {
    this.props.expiresAt = new ExpiresAt(new Date());
    this.props.updatedAt = new UpdatedAt(new Date());
  }

  belongsToAgent(agent: UserAgent): boolean {
    return this.props.userAgent.equals(agent);
  }

  get id(): Id {
    return this.props.id;
  }

  get userId(): Id {
    return this.props.userId;
  }

  get token(): Token {
    return this.props.token;
  }

  get expiresAt(): ExpiresAt {
    return this.props.expiresAt;
  }

  get userAgent(): UserAgent {
    return this.props.userAgent;
  }

  get createdAt(): CreatedAt {
    return this.props.createdAt;
  }

  get updatedAt(): UpdatedAt {
    return this.props.updatedAt;
  }
}
