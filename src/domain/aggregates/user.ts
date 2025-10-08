import { Account } from './account';
import { AccountAlreadyLinkedError } from '../domainErrors';
import { Email } from '../valueObjects/email';
import { Name } from '../valueObjects/name';
import { PasswordHash } from '../valueObjects/passwordHash';
import { Provider } from '../valueObjects/provider';
import { ProviderUserId } from '../valueObjects/providerUserId';
import { UserId } from '../valueObjects/userId';

export interface UserProps {
  id: UserId;
  name: Name;
  email: Email;
  accounts?: Account[];
  passwordHash?: PasswordHash;
}

const ensureUniqueAccounts = (accounts: Account[]): Account[] => {
  const seen = new Set<string>();
  accounts.forEach((account) => {
    const key = `${account.provider.toString()}::${account.providerUserId
      .toString()
      .toLowerCase()}`;
    if (seen.has(key)) {
      throw new AccountAlreadyLinkedError(
        account.provider.toString(),
        account.providerUserId.toString()
      );
    }
    seen.add(key);
  });
  return accounts;
};

interface InternalProps extends UserProps {
  accounts: Account[];
}

export class User {
  private constructor(private readonly props: InternalProps) {}

  static create(props: UserProps): User {
    return new User({
      ...props,
      accounts: ensureUniqueAccounts([...(props.accounts ?? [])]),
    });
  }

  static createLocal(params: {
    id?: UserId;
    name: Name;
    email: Email;
    passwordHash: PasswordHash;
  }): User {
    return new User({
      id: params.id ?? UserId.generate(),
      name: params.name,
      email: params.email,
      passwordHash: params.passwordHash,
      accounts: [],
    });
  }

  get id(): UserId {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash | undefined {
    return this.props.passwordHash;
  }

  get accounts(): Account[] {
    return [...this.props.accounts];
  }

  linkAccount(params: {
    provider: Provider;
    providerUserId: ProviderUserId;
    email?: Email;
  }): Account {
    const key = `${params.provider.toString()}::${params.providerUserId.toString().toLowerCase()}`;

    const alreadyLinked = this.props.accounts.some((account) => {
      const accountKey = `${account.provider.toString()}::${account.providerUserId
        .toString()
        .toLowerCase()}`;
      return accountKey === key;
    });

    if (alreadyLinked) {
      throw new AccountAlreadyLinkedError(
        params.provider.toString(),
        params.providerUserId.toString()
      );
    }

    const account = Account.create({
      provider: params.provider,
      providerUserId: params.providerUserId,
      email: params.email,
    });

    this.props.accounts.push(account);
    return account;
  }

  isAccountLinked(provider: Provider): boolean {
    return this.props.accounts.some((account) => account.provider.equals(provider));
  }
}
