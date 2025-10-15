import { User } from '../aggregates/User';
import { Id } from '../value-objects/Id';
import { Email } from '../value-objects/Email';
import { AuthProviderType } from '../value-objects/AuthProviderType';
import { AccountExternalId } from '../value-objects/AccountExternalId';

export interface UserRepository {
  findById(id: Id): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByAccount(provider: AuthProviderType, accountId: AccountExternalId): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
