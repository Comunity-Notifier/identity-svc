import { Account } from '../../domain/aggregates/account';
import { User } from '../../domain/aggregates/user';
import { Provider } from '../../domain/valueObjects/provider';
import { ProviderUserId } from '../../domain/valueObjects/providerUserId';

export interface LinkedAccount {
  user: User;
  account: Account;
}

export interface AccountRepository {
  findByProviderUserId(
    provider: Provider,
    providerUserId: ProviderUserId
  ): Promise<LinkedAccount | null>;
  linkToUser(user: User, account: Account): Promise<void>;
}
