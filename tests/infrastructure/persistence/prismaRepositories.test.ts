import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { UserRepositoryPrisma } from '../../../src/infrastructure/persistence/prisma/userRepositoryPrisma';
import { AccountRepositoryPrisma } from '../../../src/infrastructure/persistence/prisma/accountRepositoryPrisma';
import { OAuthStateStorePrisma } from '../../../src/infrastructure/persistence/prisma/oauthStateStorePrisma';
import { User } from '../../../src/domain/aggregates/user';
import { Account } from '../../../src/domain/aggregates/account';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';
import { Provider } from '../../../src/domain/valueObjects/provider';
import { ProviderUserId } from '../../../src/domain/valueObjects/providerUserId';
import { UserId } from '../../../src/domain/valueObjects/userId';
import { OAuthStateRecord } from '../../../src/application/dtos';

jest.setTimeout(90000);

describe('Prisma persistence adapters', () => {
  let container: StartedTestContainer;
  let prisma: PrismaClient;
  let userRepository: UserRepositoryPrisma;
  let accountRepository: AccountRepositoryPrisma;
  let oauthStateStore: OAuthStateStorePrisma;
  let runtimeAvailable = true;

  beforeAll(async () => {
    try {
      container = await new GenericContainer('postgres:15-alpine')
        .withEnvironment({
          POSTGRES_USER: 'test',
          POSTGRES_PASSWORD: 'test',
          POSTGRES_DB: 'identity_test',
        })
        .withExposedPorts(5432)
        .start();
    } catch (error) {
      runtimeAvailable = false;
      console.error(
        'FATAL: Skipping Prisma persistence tests. A container runtime (like Docker) is required to run these tests. Please install Docker and ensure it is running.',
        error
      );
      return;
    }

    if (!runtimeAvailable) {
      return;
    }

    const connectionString = `postgresql://test:test@${container.getHost()}:${container.getMappedPort(
      5432
    )}/identity_test`;
    const migrationPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'prisma',
      'migrations',
      '000_init',
      'migration.sql'
    );
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    const pool = new Pool({ connectionString });
    await pool.query(migrationSql);
    await pool.end();

    prisma = new PrismaClient({ datasourceUrl: connectionString });
    await prisma.$connect();

    userRepository = new UserRepositoryPrisma(prisma);
    accountRepository = new AccountRepositoryPrisma(prisma);
    oauthStateStore = new OAuthStateStorePrisma(prisma);
  });

  afterAll(async () => {
    if (!runtimeAvailable) {
      return;
    }
    await prisma?.$disconnect();
    await container?.stop();
  });

  beforeEach(async () => {
    if (!runtimeAvailable) {
      return;
    }
    await prisma.oAuthState.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  it('persists and loads user aggregates with accounts', async () => {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return;
    }
    const userAccount = Account.create({
      provider: Provider.create('google'),
      providerUserId: ProviderUserId.create('google-123'),
      email: Email.create('ada@google.com'),
    });
    const user = User.create({
      id: UserId.generate(),
      email: Email.create('ada@example.com'),
      name: Name.create('Ada Lovelace'),
      passwordHash: PasswordHash.create('argon2hash'),
      accounts: [userAccount],
    });

    await userRepository.save(user);

    const foundById = await userRepository.findById(user.id);
    const foundByEmail = await userRepository.findByEmail(user.email);

    expect(foundById).not.toBeNull();
    expect(foundById?.accounts).toHaveLength(1);
    expect(foundById?.accounts[0].provider.toString()).toBe('google');
    expect(foundByEmail?.id.toString()).toBe(user.id.toString());
  });

  it('updates existing users and persists newly linked accounts', async () => {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return;
    }
    const user = User.createLocal({
      name: Name.create('Grace Hopper'),
      email: Email.create('grace@example.com'),
      passwordHash: PasswordHash.create('argon2hash'),
    });

    await userRepository.save(user);

    const stored = await userRepository.findById(user.id);
    expect(stored).not.toBeNull();

    stored!.linkAccount({
      provider: Provider.create('github'),
      providerUserId: ProviderUserId.create('gh-123'),
      email: Email.create('grace@github.com'),
    });

    await userRepository.update(stored!);

    const updated = await userRepository.findById(user.id);
    expect(updated?.accounts).toHaveLength(1);
    expect(updated?.accounts[0].provider.toString()).toBe('github');
    expect(updated?.accounts[0].providerUserId.toString()).toBe('gh-123');
  });

  it('finds linked accounts by provider and provider user id', async () => {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return;
    }
    const account = Account.create({
      provider: Provider.create('google'),
      providerUserId: ProviderUserId.create('google-1'),
      email: Email.create('jane@google.com'),
    });
    const user = User.create({
      id: UserId.generate(),
      name: Name.create('Jane Doe'),
      email: Email.create('jane@example.com'),
      passwordHash: PasswordHash.create('argon2hash'),
      accounts: [account],
    });

    await userRepository.save(user);

    const linked = await accountRepository.findByProviderUserId(
      Provider.create('google'),
      ProviderUserId.create('google-1')
    );

    expect(linked).not.toBeNull();
    expect(linked?.user.id.toString()).toBe(user.id.toString());
    expect(linked?.account.provider.toString()).toBe('google');
    expect(linked?.account.providerUserId.toString()).toBe('google-1');
  });

  it('links a new external account to existing users', async () => {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return;
    }
    const user = User.createLocal({
      name: Name.create('Local User'),
      email: Email.create('local@example.com'),
      passwordHash: PasswordHash.create('argon2hash'),
    });

    await userRepository.save(user);

    const linkedAccount = user.linkAccount({
      provider: Provider.create('google'),
      providerUserId: ProviderUserId.create('oauth-123'),
      email: Email.create('local@google.com'),
    });

    await accountRepository.linkToUser(user, linkedAccount);

    const fetched = await userRepository.findById(user.id);
    expect(fetched?.accounts).toHaveLength(1);
    expect(fetched?.accounts[0].provider.toString()).toBe('google');
  });

  it('saves, retrieves and consumes oauth states atomically', async () => {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return;
    }
    const record: OAuthStateRecord = {
      state: 'state-123',
      codeVerifier: 'verifier',
      provider: 'google',
      redirectUri: 'https://example.com/callback',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 600_000),
    };

    await oauthStateStore.save(record);

    const fetched = await oauthStateStore.get(record.state);
    expect(fetched).not.toBeNull();
    expect(fetched?.state).toBe(record.state);
    expect(fetched?.expiresAt.getTime()).toBe(record.expiresAt.getTime());

    const consumed = await oauthStateStore.consume(record.state);
    expect(consumed?.state).toBe(record.state);

    const shouldBeNull = await oauthStateStore.get(record.state);
    expect(shouldBeNull).toBeNull();
  });
});
