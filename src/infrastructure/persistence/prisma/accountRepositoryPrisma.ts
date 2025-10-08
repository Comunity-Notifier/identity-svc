import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

import { AccountRepository, LinkedAccount } from '../../../application/ports/accountRepository';
import { Account } from '../../../domain/aggregates/account';
import { User } from '../../../domain/aggregates/user';
import { Provider } from '../../../domain/valueObjects/provider';
import { ProviderUserId } from '../../../domain/valueObjects/providerUserId';
import { Email } from '../../../domain/valueObjects/email';
import { mapPrismaUserToDomain } from './prismaMappers';

export class AccountRepositoryPrisma implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProviderUserId(
    provider: Provider,
    providerUserId: ProviderUserId
  ): Promise<LinkedAccount | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerUserId: {
          provider: provider.toString(),
          providerUserId: providerUserId.toString(),
        },
      },
      include: {
        user: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!account) {
      return null;
    }

    const user = mapPrismaUserToDomain({
      ...account.user,
      accounts: account.user.accounts,
    });

    const linkedAccount = user.accounts.find(
      (candidate) =>
        candidate.provider.toString() === provider.toString() &&
        candidate.providerUserId.toString() === providerUserId.toString()
    );

    const accountForUser =
      linkedAccount ??
      Account.create({
        provider,
        providerUserId,
        email: account.email ? Email.create(account.email) : undefined,
      });

    return {
      user,
      account: accountForUser,
    };
  }

  async linkToUser(user: User, account: Account): Promise<void> {
    await this.prisma.account.create({
      data: {
        id: randomUUID(),
        userId: user.id.toString(),
        provider: account.provider.toString(),
        providerUserId: account.providerUserId.toString(),
        email: account.email ? account.email.toString() : null,
      },
    });
  }
}
