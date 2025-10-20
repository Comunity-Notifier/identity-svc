import { Id } from '../value-objects/Id';
import { AuthProvider, AuthProviderType } from '../value-objects/AuthProviderType';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt';
import { AccountExternalId } from '../value-objects/AccountExternalId';
import { Email } from '../value-objects/Email';

export interface AccountProps {
  id: Id;
  userId: Id;
  accountId: AccountExternalId;
  provider: AuthProviderType;
  email?: Email;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export class Account {
  constructor(private readonly props: AccountProps) {}

  get id(): Id {
    return this.props.id;
  }

  get userId(): Id {
    return this.props.userId;
  }

  get accountId(): AccountExternalId {
    return this.props.accountId;
  }

  get provider(): AuthProviderType {
    return this.props.provider;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get createdAt(): CreatedAt {
    return this.props.createdAt;
  }

  get updatedAt(): UpdatedAt {
    return this.props.updatedAt;
  }

  equals(other: Account): boolean {
    return (
      this.id.equals(other.id) &&
      this.userId.equals(other.userId) &&
      this.provider.equals(other.provider) &&
      this.accountId.equals(other.accountId)
    );
  }

  toPrimitives(): {
    id: string;
    userId: string;
    provider: AuthProvider;
    accountId: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id.toString(),
      userId: this.userId.toString(),
      provider: this.provider.getProvider(),
      accountId: this.accountId.toString(),
      email: this.email?.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
