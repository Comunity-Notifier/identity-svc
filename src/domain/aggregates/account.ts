import { Email } from '../valueObjects/email';
import { Provider } from '../valueObjects/provider';
import { ProviderUserId } from '../valueObjects/providerUserId';

export interface AccountProps {
  provider: Provider;
  providerUserId: ProviderUserId;
  email?: Email;
}

export class Account {
  private constructor(private readonly props: AccountProps) {}

  static create(props: AccountProps): Account {
    return new Account(props);
  }

  get provider(): Provider {
    return this.props.provider;
  }

  get providerUserId(): ProviderUserId {
    return this.props.providerUserId;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  equals(other: Account): boolean {
    return (
      this.props.provider.toString() === other.provider.toString() &&
      this.props.providerUserId.toString() === other.providerUserId.toString()
    );
  }
}
