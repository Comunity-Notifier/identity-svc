import { beforeAll, describe, expect, it } from '@jest/globals';
import { exportJWK, generateKeyPair, type JWK } from 'jose';

import { TokenServiceJose } from '../../../src/infrastructure/crypto/tokenServiceJose';

let basePrivateJwk: JWK;

const buildService = async (
  overrides: Partial<{
    issuer: string;
    audience: string;
    accessTokenTtlMs: number;
    clock: () => Date;
    privateKeyJwk: JWK;
  }> = {}
) =>
  TokenServiceJose.create({
    privateKeyJwk: { ...(overrides.privateKeyJwk ?? basePrivateJwk) },
    algorithm: 'EdDSA',
    issuer: overrides.issuer ?? 'identity-svc',
    audience: overrides.audience ?? 'client-app',
    accessTokenTtlMs: overrides.accessTokenTtlMs ?? 60_000,
    clock: overrides.clock,
  });

describe('TokenServiceJose', () => {
  beforeAll(async () => {
    const { privateKey } = await generateKeyPair('EdDSA');
    basePrivateJwk = await exportJWK(privateKey);
    basePrivateJwk.kid = 'test-key';
    basePrivateJwk.alg = 'EdDSA';
  });

  it('signs and verifies access tokens', async () => {
    const service = await buildService();

    const { token, expiresAt } = await service.signAccessToken({
      sub: 'user-id',
      email: 'user@example.com',
      name: 'User Example',
      providerAccounts: [{ provider: 'google', providerUserId: 'google-123' }],
    });

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const payload = await service.verify(token);
    expect(payload).toEqual({
      sub: 'user-id',
      email: 'user@example.com',
      name: 'User Example',
      providerAccounts: [{ provider: 'google', providerUserId: 'google-123' }],
    });
  });

  it('exposes JWKS with key metadata', async () => {
    const service = await buildService();
    const jwks = await service.getPublicJwks();

    expect(jwks).toEqual(
      expect.objectContaining({
        keys: expect.arrayContaining([
          expect.objectContaining({ kid: 'test-key', alg: 'EdDSA', use: 'sig' }),
        ]),
      })
    );
  });

  it('rejects tokens with invalid issuer or audience', async () => {
    const service = await buildService();
    const token = (
      await service.signAccessToken({
        sub: 'user-id',
        email: 'user@example.com',
        providerAccounts: [],
      })
    ).token;

    const mismatchedIssuer = await buildService({ issuer: 'other-issuer' });
    await expect(mismatchedIssuer.verify(token)).rejects.toThrow();

    const mismatchedAudience = await buildService({ audience: 'other-client' });
    await expect(mismatchedAudience.verify(token)).rejects.toThrow();
  });

  it('rejects expired tokens', async () => {
    const service = await buildService({ accessTokenTtlMs: -1_000 });
    const { token } = await service.signAccessToken({
      sub: 'user-id',
      email: 'user@example.com',
      providerAccounts: [],
    });

    await expect(service.verify(token)).rejects.toThrow(/"exp" claim timestamp check failed/);
  });

  it('rejects tokens signed with different keys', async () => {
    const service = await buildService();
    const { token } = await service.signAccessToken({
      sub: 'user-id',
      email: 'user@example.com',
      providerAccounts: [],
    });

    const { privateKey } = await generateKeyPair('EdDSA');
    const otherPrivateJwk = await exportJWK(privateKey);
    otherPrivateJwk.kid = 'other-key';
    otherPrivateJwk.alg = 'EdDSA';
    const differentKeyService = await buildService({
      privateKeyJwk: otherPrivateJwk,
    });

    await expect(differentKeyService.verify(token)).rejects.toThrow();
  });
});
