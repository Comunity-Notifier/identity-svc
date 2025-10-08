import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';

import { UserRepository } from '../../../application/ports/userRepository';
import { User } from '../../../domain/aggregates/user';
import { Email } from '../../../domain/valueObjects/email';
import { UserId } from '../../../domain/valueObjects/userId';
import { mapPrismaUserToDomain } from './prismaMappers';

export class UserRepositoryPrisma implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.toString() },
      include: { accounts: true },
    });
    return user ? mapPrismaUserToDomain(user) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toString() },
      include: { accounts: true },
    });
    return user ? mapPrismaUserToDomain(user) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id.toString(),
        email: user.email.toString(),
        name: user.name.toString(),
        passwordHash: user.passwordHash ? user.passwordHash.toString() : null,
        accounts: {
          create: user.accounts.map((account) => ({
            id: randomUUID(),
            provider: account.provider.toString(),
            providerUserId: account.providerUserId.toString(),
            email: account.email ? account.email.toString() : null,
          })),
        },
      },
    });
  }

  async update(user: User): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: user.id.toString() },
        data: {
          email: user.email.toString(),
          name: user.name.toString(),
          passwordHash: user.passwordHash ? user.passwordHash.toString() : null,
        },
      });

      await tx.account.deleteMany({ where: { userId: user.id.toString() } });

      if (user.accounts.length > 0) {
        await tx.account.createMany({
          data: user.accounts.map((account) => ({
            id: randomUUID(),
            userId: user.id.toString(),
            provider: account.provider.toString(),
            providerUserId: account.providerUserId.toString(),
            email: account.email ? account.email.toString() : null,
          })),
        });
      }
    });
  }
}
