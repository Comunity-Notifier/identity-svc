import { PrismaClient, Prisma, User as PrismaUser, Account as PrismaAccount } from '@prisma/client';

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string | null;
  accounts: Account[];
}

export interface UserRepository {
  byId(id: string): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  findByAccount(provider: string, providerUserId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}

function mapUser(prismaUser: PrismaUser & { accounts: PrismaAccount[] }): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    name: prismaUser.name,
    passwordHash: prismaUser.passwordHash,
    accounts: prismaUser.accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerUserId: account.providerUserId,
      email: account.email,
    })),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return true;
  }
  return false;
}

function isEmailUniqueError(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) {
    return false;
  }

  const target = (error as Prisma.PrismaClientKnownRequestError).meta?.target;

  if (Array.isArray(target)) {
    return target.length === 1 && target[0] === 'email';
  }

  if (typeof target === 'string') {
    return target.includes('email');
  }

  return false;
}

function isAccountUniqueError(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) {
    return false;
  }

  const target = (error as Prisma.PrismaClientKnownRequestError).meta?.target;

  if (Array.isArray(target)) {
    return target.includes('provider') && target.includes('providerUserId');
  }

  if (typeof target === 'string') {
    return target.includes('provider') && target.includes('providerUserId');
  }

  return false;
}

function isForeignKeyError(error: unknown, field: string): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    const metaField = error.meta?.field_name;
    if (typeof metaField === 'string') {
      return metaField.includes(field);
    }
  }
  return false;
}

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

function translatePrismaError(error: unknown): never {
  if (isEmailUniqueError(error)) {
    throw new Error('EmailAlreadyTaken');
  }
  if (isAccountUniqueError(error)) {
    throw new Error('AccountAlreadyLinked');
  }
  if (isForeignKeyError(error, 'Account_userId_fkey')) {
    throw new Error('UserNotFound');
  }
  if (isRecordNotFoundError(error)) {
    throw new Error('UserNotFound');
  }
  throw error;
}

function ensureAccountsBelongToUser(user: User): void {
  for (const account of user.accounts) {
    if (account.userId && account.userId !== user.id) {
      throw new Error('UserNotFound');
    }
  }
}

export class UserRepositoryPg implements UserRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async byId(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
    return user ? mapUser(user) : null;
  }

  async byEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
    return user ? mapUser(user) : null;
  }

  async findByAccount(provider: string, providerUserId: string): Promise<User | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerUserId_unique: {
          provider,
          providerUserId,
        },
      },
      include: {
        user: {
          include: { accounts: true },
        },
      },
    });

    if (!account?.user) {
      return null;
    }

    return mapUser(account.user);
  }

  async save(user: User): Promise<void> {
    ensureAccountsBelongToUser(user);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: user.passwordHash ?? null,
          },
        });

        if (user.accounts.length > 0) {
          await tx.account.createMany({
            data: user.accounts.map((account) => ({
              id: account.id,
              userId: account.userId ?? user.id,
              provider: account.provider,
              providerUserId: account.providerUserId,
              email: account.email ?? null,
            })),
            skipDuplicates: false,
          });
        }
      });
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(user: User): Promise<void> {
    ensureAccountsBelongToUser(user);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            email: user.email,
            name: user.name,
            passwordHash: user.passwordHash ?? null,
          },
        });

        const existingAccounts = await tx.account.findMany({
          where: { userId: user.id },
        });

        const existingKeys = new Set(
          existingAccounts.map((account) => `${account.provider}::${account.providerUserId}`)
        );

        const insertableAccounts = user.accounts.filter((account) => {
          const key = `${account.provider}::${account.providerUserId}`;
          if (existingKeys.has(key)) {
            return false;
          }
          existingKeys.add(key);
          return true;
        });

        if (insertableAccounts.length > 0) {
          await tx.account.createMany({
            data: insertableAccounts.map((account) => ({
              id: account.id,
              userId: account.userId ?? user.id,
              provider: account.provider,
              providerUserId: account.providerUserId,
              email: account.email ?? null,
            })),
            skipDuplicates: false,
          });
        }
      });
    } catch (error) {
      translatePrismaError(error);
    }
  }
}
