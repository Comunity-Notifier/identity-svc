import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { startTestDb, stopTestDb } from './testdb';
import {
  UserRepositoryPg,
  User,
  Account,
} from 'src/infrastructure/persistence/pg/userRepositoryPg';

jest.setTimeout(120_000);
let prisma: PrismaClient;
let repository: UserRepositoryPg;

const buildAccount = (defaultUserId: string, overrides: Partial<Account> = {}): Account => {
  const userId = overrides.userId ?? defaultUserId;
  return {
    id: overrides.id ?? randomUUID(),
    userId,
    provider: overrides.provider ?? 'google',
    providerUserId: overrides.providerUserId ?? `provider-${randomUUID()}`,
    email: overrides.email ?? 'account@example.com',
  };
};

const buildUser = ({
  id = randomUUID(),
  email = `user-${randomUUID()}@example.com`,
  name = 'Test User',
  passwordHash = 'hashed-password',
  accounts = [],
}: {
  id?: string;
  email?: string;
  name?: string;
  passwordHash?: string | null;
  accounts?: Partial<Account>[];
} = {}): User => ({
  id,
  email,
  name,
  passwordHash,
  accounts: accounts.map((account) => buildAccount(id, account)),
});

beforeAll(async () => {
  await startTestDb();
  prisma = new PrismaClient();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  repository = new UserRepositoryPg(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
  await stopTestDb();
});

beforeEach(async () => {
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
});

describe('UserRepositoryPg integration', () => {
  it('save + byEmail stores and retrieves a user without accounts', async () => {
    const user = buildUser({ accounts: [] });

    await repository.save(user);

    const found = await repository.byEmail(user.email);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.accounts).toHaveLength(0);
  });

  it('findByAccount returns the user owning the account', async () => {
    const userId = randomUUID();
    const provider = 'google';
    const providerUserId = 'g123';

    const user = buildUser({
      id: userId,
      accounts: [{ provider, providerUserId }],
    });

    await repository.save(user);

    const found = await repository.findByAccount(provider, providerUserId);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider,
          providerUserId,
        }),
      ])
    );
  });

  it('enforces unique email at the database level', async () => {
    const email = 'duplicate@example.com';

    const user1 = buildUser({ email });
    const user2 = buildUser({ email });

    await repository.save(user1);

    await expect(repository.save(user2)).rejects.toThrow('EmailAlreadyTaken');
  });

  it('enforces unique provider/providerUserId combination', async () => {
    const provider = 'google';
    const providerUserId = 'g123';

    const user1 = buildUser({
      accounts: [{ provider, providerUserId }],
    });
    const user2 = buildUser({
      accounts: [{ provider, providerUserId }],
    });

    await repository.save(user1);

    await expect(repository.save(user2)).rejects.toThrow('AccountAlreadyLinked');
  });

  it('rejects accounts that reference a different user id', async () => {
    const mismatchedUserId = randomUUID();

    const user = buildUser({
      accounts: [
        {
          userId: mismatchedUserId,
          provider: 'github',
          providerUserId: 'gh-123',
        },
      ],
    });

    await expect(repository.save(user)).rejects.toThrow('UserNotFound');
  });

  it('update prevents changing email to an existing one', async () => {
    const user1 = buildUser({ email: 'existing@example.com' });
    const user2 = buildUser({ email: 'other@example.com' });

    await repository.save(user1);
    await repository.save(user2);

    const storedUser1 = await repository.byId(user1.id);
    expect(storedUser1).not.toBeNull();

    await expect(
      repository.update({
        ...storedUser1!,
        email: user2.email,
      })
    ).rejects.toThrow('EmailAlreadyTaken');
  });
});
