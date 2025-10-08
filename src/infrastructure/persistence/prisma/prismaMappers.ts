import { Account } from '../../../domain/aggregates/account';
import { User } from '../../../domain/aggregates/user';
import { Email } from '../../../domain/valueObjects/email';
import { Name } from '../../../domain/valueObjects/name';
import { PasswordHash } from '../../../domain/valueObjects/passwordHash';
import { Provider } from '../../../domain/valueObjects/provider';
import { ProviderUserId } from '../../../domain/valueObjects/providerUserId';
import { UserId } from '../../../domain/valueObjects/userId';
import { OAuthStateRecord } from '../../../application/dtos';

interface PrismaAccountRow {
  provider: string;
  providerUserId: string;
  email: string | null;
}

interface PrismaUserRow {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  accounts: PrismaAccountRow[];
}

interface PrismaOAuthStateRow {
  state: string;
  codeVerifier: string;
  nonce: string | null;
  provider: string;
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

export type PrismaUserWithAccounts = PrismaUserRow;

export const mapPrismaUserToDomain = (record: PrismaUserWithAccounts): User => {
  const accounts = record.accounts.map((account) =>
    Account.create({
      provider: Provider.create(account.provider),
      providerUserId: ProviderUserId.create(account.providerUserId),
      email: account.email ? Email.create(account.email) : undefined,
    })
  );

  return User.create({
    id: UserId.create(record.id),
    email: Email.create(record.email),
    name: Name.create(record.name),
    passwordHash: record.passwordHash ? PasswordHash.create(record.passwordHash) : undefined,
    accounts,
  });
};

export const mapOAuthStateToRecord = (row: PrismaOAuthStateRow): OAuthStateRecord => ({
  state: row.state,
  codeVerifier: row.codeVerifier,
  nonce: row.nonce ?? undefined,
  provider: row.provider,
  redirectUri: row.redirectUri,
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
});
