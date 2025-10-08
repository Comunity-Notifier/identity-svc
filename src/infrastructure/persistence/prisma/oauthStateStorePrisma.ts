import { PrismaClient, Prisma } from '@prisma/client';

import { OAuthStateStore } from '../../../application/ports/oauthStateStore';
import { OAuthStateRecord } from '../../../application/dtos';
import { mapOAuthStateToRecord } from './prismaMappers';

export class OAuthStateStorePrisma implements OAuthStateStore {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: OAuthStateRecord): Promise<void> {
    await this.prisma.oAuthState.upsert({
      where: { state: record.state },
      create: {
        state: record.state,
        codeVerifier: record.codeVerifier,
        nonce: record.nonce ?? null,
        provider: record.provider,
        redirectUri: record.redirectUri,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
      update: {
        codeVerifier: record.codeVerifier,
        nonce: record.nonce ?? null,
        provider: record.provider,
        redirectUri: record.redirectUri,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
    });
  }

  async get(state: string): Promise<OAuthStateRecord | null> {
    const record = await this.prisma.oAuthState.findUnique({
      where: { state },
    });
    return record ? mapOAuthStateToRecord(record) : null;
  }

  async consume(state: string): Promise<OAuthStateRecord | null> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const record = await tx.oAuthState.findUnique({ where: { state } });
      if (!record) {
        return null;
      }

      await tx.oAuthState.delete({ where: { state } });
      return mapOAuthStateToRecord(record);
    });
  }
}
