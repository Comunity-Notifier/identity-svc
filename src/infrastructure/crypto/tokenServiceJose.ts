import { randomUUID } from 'crypto';
import { importJWK, jwtVerify, SignJWT, type JWTPayload, type KeyLike, type JWK } from 'jose';

import { TokenService } from '../../application/ports/tokenService';
import { AccessToken, TokenPayload } from '../../application/dtos';

const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface TokenServiceJoseOptions {
  issuer: string;
  audience: string;
  privateKeyJwk: JWK;
  algorithm: string;
  accessTokenTtlMs?: number;
  clock?: () => Date;
}

interface InternalOptions {
  issuer: string;
  audience: string;
  algorithm: string;
  accessTokenTtlMs: number;
  clock: () => Date;
  kid: string;
  privateKey: KeyLike | Uint8Array;
  publicKey: KeyLike | Uint8Array;
  publicJwk: JWK;
}

export class TokenServiceJose implements TokenService {
  private constructor(private readonly options: InternalOptions) {}

  static async create(options: TokenServiceJoseOptions): Promise<TokenServiceJose> {
    const { privateKeyJwk } = options;
    if (!privateKeyJwk.kid) {
      throw new Error('privateKeyJwk must include a "kid" property');
    }

    const privateJwk = { ...privateKeyJwk };
    const { d: _discard, ...restPublicJwk } = privateKeyJwk;
    const publicJwk: JWK = { ...restPublicJwk };

    const privateKey = await importJWK(privateJwk, options.algorithm);
    const publicKey = await importJWK(publicJwk, options.algorithm);

    const internal: InternalOptions = {
      issuer: options.issuer,
      audience: options.audience,
      algorithm: options.algorithm,
      accessTokenTtlMs: options.accessTokenTtlMs ?? DEFAULT_ACCESS_TOKEN_TTL_MS,
      clock: options.clock ?? (() => new Date()),
      kid: privateKeyJwk.kid,
      privateKey,
      publicKey,
      publicJwk: {
        ...publicJwk,
        kid: privateKeyJwk.kid,
        alg: options.algorithm,
        use: 'sig',
      },
    };

    return new TokenServiceJose(internal);
  }

  async signAccessToken(payload: TokenPayload): Promise<AccessToken> {
    const now = this.options.clock();
    const issuedAt = Math.floor(now.getTime() / 1000);
    const expiresAt = new Date(now.getTime() + this.options.accessTokenTtlMs);
    const expiration = Math.floor(expiresAt.getTime() / 1000);
    const jwtId = randomUUID();

    const signJwt = new SignJWT({
      email: payload.email,
      name: payload.name,
      providerAccounts: payload.providerAccounts,
    })
      .setProtectedHeader({
        alg: this.options.algorithm,
        kid: this.options.kid,
        typ: 'JWT',
      })
      .setSubject(payload.sub)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiration)
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setJti(jwtId);

    const token = await signJwt.sign(this.options.privateKey);

    return {
      token,
      expiresAt,
    };
  }

  async verify(token: string): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.options.publicKey, {
      issuer: this.options.issuer,
      audience: this.options.audience,
    });

    return toTokenPayload(payload);
  }

  getPublicJwks(): Promise<unknown> {
    return Promise.resolve({ keys: [this.options.publicJwk] });
  }
}

const toTokenPayload = (payload: JWTPayload): TokenPayload => {
  if (!payload.sub) {
    throw new Error('Token payload is missing subject');
  }

  if (typeof payload.email !== 'string') {
    throw new Error('Token payload is missing email');
  }

  const providerAccountsRaw: unknown = payload.providerAccounts ?? [];

  const providerAccounts: TokenPayload['providerAccounts'] = Array.isArray(providerAccountsRaw)
    ? providerAccountsRaw.reduce<TokenPayload['providerAccounts']>((list, entry) => {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as { provider?: unknown }).provider === 'string' &&
          typeof (entry as { providerUserId?: unknown }).providerUserId === 'string'
        ) {
          const typed = entry as { provider: string; providerUserId: string };
          list.push({
            provider: typed.provider,
            providerUserId: typed.providerUserId,
          });
        }
        return list;
      }, [])
    : [];

  return {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    providerAccounts,
  };
};
