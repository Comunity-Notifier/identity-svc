import path from 'path';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);
const projectRoot = path.resolve(process.cwd());

let postgresContainer: StartedPostgreSqlContainer | null = null;
let databasePrepared = false;

export async function startTestDb(): Promise<void> {
  if (databasePrepared) {
    return;
  }

  const reuseUrl = process.env.TEST_DB_URL ?? undefined;

  if (!reuseUrl) {
    const container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('identity_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .withStartupTimeout(60_000)
      .start();

    postgresContainer = container;

    const mappedPort = container.getMappedPort(5432);
    const databaseUrl = `postgresql://postgres:postgres@localhost:${mappedPort}/identity_test?schema=public`;

    process.env.DATABASE_URL = databaseUrl;
  } else {
    process.env.DATABASE_URL = reuseUrl;
  }

  await exec('npx prisma migrate deploy --schema prisma/schema.prisma', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? '' },
  });
  databasePrepared = true;
}

export async function stopTestDb(): Promise<void> {
  databasePrepared = false;

  if (!postgresContainer) {
    return;
  }

  await postgresContainer.stop();
  postgresContainer = null;
}

describe('testdb helper', () => {
  it('exposes lifecycle helpers', () => {
    expect(typeof startTestDb).toBe('function');
    expect(typeof stopTestDb).toBe('function');
  });
});
