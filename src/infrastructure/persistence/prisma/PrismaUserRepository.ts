import { PrismaClient, Prisma, User as PrismaUser, Account as PrismaAccount } from '@prisma/client';
import { UserRepository } from 'src/domain/repositories/UserRepository';
import { User } from 'src/domain/aggregates/User';
import { Account } from 'src/domain/entities/Account';
import { Id } from 'src/domain/value-objects/Id';
import { Name } from 'src/domain/value-objects/Name';
import { Email } from 'src/domain/value-objects/Email';
import { Image } from 'src/domain/value-objects/Image';
import { CreatedAt } from 'src/domain/value-objects/CreatedAt';
import { UpdatedAt } from 'src/domain/value-objects/UpdatedAt';
import { PasswordHash } from 'src/domain/value-objects/PasswordHash';
import { AuthProvider, AuthProviderType } from 'src/domain/value-objects/AuthProviderType';
import { AccountExternalId } from 'src/domain/value-objects/AccountExternalId';

function mapAccount(prismaAccount: PrismaAccount): Account {
  return new Account({
    id: new Id(prismaAccount.id),
    userId: new Id(prismaAccount.userId),
    provider: new AuthProviderType(prismaAccount.provider as AuthProvider),
    accountId: new AccountExternalId(prismaAccount.accountId),
    email: prismaAccount.email ? new Email(prismaAccount.email) : undefined,
    createdAt: new CreatedAt(prismaAccount.createdAt),
    updatedAt: new UpdatedAt(prismaAccount.updatedAt),
  });
}

function mapUser(prismaUser: PrismaUser & { accounts: PrismaAccount[] }): User {
  return new User({
    id: new Id(prismaUser.id),
    name: new Name(prismaUser.name),
    email: new Email(prismaUser.email),
    passwordHash: prismaUser.passwordHash ? new PasswordHash(prismaUser.passwordHash) : undefined,
    image: prismaUser.image ? new Image(prismaUser.image) : undefined,
    accounts: prismaUser.accounts.map(mapAccount),
    createdAt: new CreatedAt(prismaUser.createdAt),
    updatedAt: new UpdatedAt(prismaUser.updatedAt),
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
    return target.includes('provider') && target.includes('accountId');
  }

  if (typeof target === 'string') {
    return target.includes('provider') && target.includes('accountId');
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

type AccountWithUser = Prisma.AccountGetPayload<{
  include: { user: { include: { accounts: true } } };
}>;

export class PrismaUserRepository implements UserRepository {
  private readonly prisma: PrismaClient;

  constructor({ prismaClient }: { prismaClient?: PrismaClient }) {
    this.prisma = prismaClient ?? new PrismaClient();
  }

  async findById(id: Id): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.toString() },
      include: { accounts: true },
    });
    return user ? mapUser(user) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toString() },
      include: { accounts: true },
    });
    return user ? mapUser(user) : null;
  }

  async findByAccount(
    provider: AuthProviderType,
    accountId: AccountExternalId
  ): Promise<User | null> {
    const account = (await this.prisma.account.findUnique({
      where: {
        provider_accountId_unique: {
          provider: provider.getProvider(),
          accountId: accountId.toString(),
        },
      },
      include: {
        user: {
          include: { accounts: true },
        },
      },
    })) as AccountWithUser | null;

    if (!account?.user) {
      return null;
    }

    return mapUser(account.user);
  }

  async save(user: User): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: user.id.toString(),
            email: user.email.toString(),
            name: user.name.toString(),
            passwordHash: user.passwordHash?.toString() ?? null,
            image: user.image?.toString() ?? null,
            createdAt: user.createdAt.toDate(),
            updatedAt: user.updatedAt.toDate(),
          },
        });

        const accounts = user.accounts;
        if (accounts.length > 0) {
          await tx.account.createMany({
            data: accounts.map((account) => ({
              id: account.id.toString(),
              userId: account.userId.toString(),
              provider: account.provider.getProvider(),
              accountId: account.accountId.toString(),
              email: account.email?.toString() ?? null,
              createdAt: account.createdAt.toDate(),
              updatedAt: account.updatedAt.toDate(),
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
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id.toString() },
          data: {
            email: user.email.toString(),
            name: user.name.toString(),
            passwordHash: user.passwordHash?.toString() ?? null,
            image: user.image?.toString() ?? null,
            updatedAt: user.updatedAt.toDate(),
          },
        });

        const existingAccounts = await tx.account.findMany({
          where: { userId: user.id.toString() },
        });

        const existingKeys = new Set(
          existingAccounts.map((account) => `${account.provider}::${account.accountId}`)
        );

        const insertableAccounts = user.accounts.filter((account) => {
          const key = `${account.provider.getProvider()}::${account.accountId.toString()}`;
          if (existingKeys.has(key)) {
            return false;
          }
          existingKeys.add(key);
          return true;
        });

        if (insertableAccounts.length > 0) {
          await tx.account.createMany({
            data: insertableAccounts.map((account) => ({
              id: account.id.toString(),
              userId: account.userId.toString(),
              provider: account.provider.getProvider(),
              accountId: account.accountId.toString(),
              email: account.email?.toString() ?? null,
              createdAt: account.createdAt.toDate(),
              updatedAt: account.updatedAt.toDate(),
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
