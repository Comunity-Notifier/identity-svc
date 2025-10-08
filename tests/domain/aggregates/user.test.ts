import { AccountAlreadyLinkedError } from '../../../src/domain/domainErrors';
import { User } from '../../../src/domain/aggregates/user';
import { Account } from '../../../src/domain/aggregates/account';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';
import { Provider } from '../../../src/domain/valueObjects/provider';
import { ProviderUserId } from '../../../src/domain/valueObjects/providerUserId';
import { UserId } from '../../../src/domain/valueObjects/userId';

const buildUser = () =>
  User.createLocal({
    name: Name.create('Grace Hopper'),
    email: Email.create('grace@example.com'),
    passwordHash: PasswordHash.create('argon2hash'),
  });

describe('identity user aggregate', () => {
  it('creates a local user with generated id', () => {
    const user = buildUser();
    expect(user.id.toString()).toHaveLength(36);
    expect(user.name.toString()).toBe('Grace Hopper');
    expect(user.email.toString()).toBe('grace@example.com');
    expect(user.passwordHash?.toString()).toBe('argon2hash');
    expect(user.accounts).toHaveLength(0);
  });

  it('rehydrates user with predefined accounts', () => {
    const user = userFromProps();
    const account = user.accounts[0];

    expect(account.provider.toString()).toBe('google');
    expect(account.providerUserId.toString()).toBe('123');
  });

  it('links a new account', () => {
    const user = buildUser();

    const account = user.linkAccount({
      provider: Provider.create('google'),
      providerUserId: ProviderUserId.create('google-123'),
      email: Email.create('grace@google.com'),
    });

    expect(account.provider.toString()).toBe('google');
    expect(account.providerUserId.toString()).toBe('google-123');
    expect(account.email?.toString()).toBe('grace@google.com');
    expect(user.accounts).toHaveLength(1);
  });

  it('throws when linking duplicate account', () => {
    const user = buildUser();
    user.linkAccount({
      provider: Provider.create('google'),
      providerUserId: ProviderUserId.create('google-123'),
    });

    expect(() =>
      user.linkAccount({
        provider: Provider.create('google'),
        providerUserId: ProviderUserId.create('google-123'),
      })
    ).toThrow(AccountAlreadyLinkedError);
  });

  it('prevents duplicated accounts during creation', () => {
    const account = Account.create({
      provider: Provider.create('github'),
      providerUserId: ProviderUserId.create('hub-1'),
      email: Email.create('user@github.com'),
    });
    expect(() =>
      User.create({
        id: UserId.generate(),
        name: Name.create('User'),
        email: Email.create('user@example.com'),
        passwordHash: PasswordHash.create('hash'),
        accounts: [account, account],
      })
    ).toThrow(AccountAlreadyLinkedError);
  });
});

function userFromProps() {
  return User.create({
    id: UserId.generate(),
    name: Name.create('Grace Hopper'),
    email: Email.create('grace@example.com'),
    passwordHash: PasswordHash.create('argon2hash'),
    accounts: [
      Account.create({
        provider: Provider.create('google'),
        providerUserId: ProviderUserId.create('123'),
        email: Email.create('grace@google.com'),
      }),
    ],
  });
}
