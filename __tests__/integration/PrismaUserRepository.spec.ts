import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { startTestDb, stopTestDb } from './testdb';
import { PrismaUserRepository } from 'src/infrastructure/persistence/prisma/PrismaUserRepository';
import { User } from 'src/domain/aggregates/User';
import { Account } from 'src/domain/entities/Account';
import { Id } from 'src/domain/value-objects/Id';
import { Name } from 'src/domain/value-objects/Name';
import { Email as EmailVO } from 'src/domain/value-objects/Email';
import { Image } from 'src/domain/value-objects/Image';
import { CreatedAt } from 'src/domain/value-objects/CreatedAt';
import { UpdatedAt } from 'src/domain/value-objects/UpdatedAt';
import { AuthProvider, AuthProviderType } from 'src/domain/value-objects/AuthProviderType';
import { AccountExternalId } from 'src/domain/value-objects/AccountExternalId';
import { PasswordHash } from 'src/domain/value-objects/PasswordHash';

describe('PrismaUserRepository integration', () => {
  jest.setTimeout(120_000);
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

  interface AccountOverrides {
    id?: string;
    provider?: AuthProvider;
    accountId?: string;
    email?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  const buildAccount = (userId: Id, overrides: AccountOverrides = {}): Account => {
    const createdAt = overrides.createdAt ?? new Date();
    const updatedAt = overrides.updatedAt ?? createdAt;

    return new Account({
      id: new Id(overrides.id ?? randomUUID()),
      userId,
      provider: new AuthProviderType(overrides.provider ?? AuthProvider.GOOGLE),
      accountId: new AccountExternalId(overrides.accountId ?? `account-${randomUUID()}`),
      email: overrides.email ? new EmailVO(overrides.email) : undefined,
      createdAt: new CreatedAt(createdAt),
      updatedAt: new UpdatedAt(updatedAt),
    });
  };

  interface UserOverrides {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    passwordHash?: string | null;
    accounts?: AccountOverrides[];
    createdAt?: Date;
    updatedAt?: Date;
  }

  const buildUser = ({
    id = randomUUID(),
    email = `user-${randomUUID()}@example.com`,
    name = 'Test User',
    image,
    passwordHash,
    accounts = [],
    createdAt = new Date(),
    updatedAt,
  }: UserOverrides = {}): User => {
    const userId = new Id(id);
    return new User({
      id: userId,
      name: new Name(name),
      email: new EmailVO(email),
      passwordHash: passwordHash ? new PasswordHash(passwordHash) : undefined,
      image: image ? new Image(image) : undefined,
      accounts: accounts.map((account) => buildAccount(userId, account)),
      createdAt: new CreatedAt(createdAt),
      updatedAt: new UpdatedAt(updatedAt ?? createdAt),
    });
  };

  beforeAll(async () => {
    await startTestDb();
    prisma = new PrismaClient();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    repository = new PrismaUserRepository({ prismaClient: prisma });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await stopTestDb();
  });

  beforeEach(async () => {
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  it('persists and retrieves a user by email without accounts', async () => {
    const user = buildUser({ accounts: [] });

    await repository.save(user);

    const found = await repository.findByEmail(user.email);

    expect(found).not.toBeNull();
    expect(found?.id.equals(user.id)).toBe(true);
    expect(found?.accounts).toHaveLength(0);
  });

  it('findByAccount returns the user owning the account', async () => {
    const userId = randomUUID();
    const provider = AuthProvider.GOOGLE;
    const providerType = new AuthProviderType(provider);
    const accountIdValue = new AccountExternalId('google-123');

    const user = buildUser({
      id: userId,
      accounts: [{ provider, accountId: accountIdValue.toString() }],
    });

    await repository.save(user);

    const found = await repository.findByAccount(providerType, accountIdValue);

    expect(found).not.toBeNull();
    expect(found?.id.equals(user.id)).toBe(true);
    const account = found?.accounts[0];
    expect(account).toBeDefined();
    expect(account?.provider.getProvider()).toBe(provider);
    expect(account?.accountId.equals(accountIdValue)).toBe(true);
  });

  it('enforces unique email at the database level', async () => {
    const email = 'duplicate@example.com';

    const user1 = buildUser({ email });
    const user2 = buildUser({ email });

    await repository.save(user1);

    await expect(repository.save(user2)).rejects.toThrow('EmailAlreadyTaken');
  });

  it('enforces unique provider/accountId combination', async () => {
    const provider = AuthProvider.GOOGLE;
    const accountId = new AccountExternalId('google-123');

    const user1 = buildUser({
      accounts: [{ provider, accountId: accountId.toString() }],
    });
    const user2 = buildUser({
      accounts: [{ provider, accountId: accountId.toString() }],
    });

    await repository.save(user1);

    await expect(repository.save(user2)).rejects.toThrow('AccountAlreadyLinked');
  });

  it('rejects constructing a user whose accounts belong to another user', () => {
    const userId = new Id(randomUUID());
    const otherUserId = new Id(randomUUID());

    expect(
      () =>
        new User({
          id: userId,
          name: new Name('Mismatch'),
          email: new EmailVO('mismatch@example.com'),
          accounts: [buildAccount(otherUserId)],
          createdAt: new CreatedAt(new Date()),
          updatedAt: new UpdatedAt(new Date()),
        })
    ).toThrow('UserAccountOwnerMismatch');
  });

  it('prevents changing email to an existing one on update', async () => {
    const user1 = buildUser({ email: 'existing@example.com' });
    const user2 = buildUser({ email: 'other@example.com' });

    await repository.save(user1);
    await repository.save(user2);

    const storedUser1 = await repository.findById(user1.id);
    expect(storedUser1).not.toBeNull();

    const conflicting = User.fromPrimitives({
      ...storedUser1!.toPrimitives(),
      email: user2.email.toString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(repository.update(conflicting)).rejects.toThrow('EmailAlreadyTaken');
  });
});
