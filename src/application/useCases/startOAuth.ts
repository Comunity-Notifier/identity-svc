import crypto from 'crypto';

import { ProviderNotConfiguredError } from '../../domain/domainErrors';
import { Provider } from '../../domain/valueObjects/provider';
import { StartOAuthCommand, StartOAuthResult } from '../dtos';
import { OAuthStateStore } from '../ports/oauthStateStore';
import { OAuthAuthorizationRequest, OAuthProvider } from '../ports/oauthProvider';

const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;
const STATE_BYTE_LENGTH = 16;
const CODE_VERIFIER_BYTE_LENGTH = 32;
const NONCE_BYTE_LENGTH = 16;

const toBase64Url = (input: Buffer): string =>
  input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

type ProviderMap = Record<string, OAuthProvider>;

export interface StartOAuthDeps {
  oauthStateStore: OAuthStateStore;
  oauthProviders: ProviderMap;
  stateTtlMs?: number;
  now?: () => Date;
  generateState?: () => string;
  generateCodeVerifier?: () => string;
  generateNonce?: () => string;
}

export class StartOAuth {
  private readonly stateTtlMs: number;

  private readonly now: () => Date;

  private readonly generateState: () => string;

  private readonly generateCodeVerifier: () => string;

  private readonly generateNonce: () => string;

  constructor(private readonly deps: StartOAuthDeps) {
    this.stateTtlMs = deps.stateTtlMs ?? DEFAULT_STATE_TTL_MS;
    this.now = deps.now ?? (() => new Date());
    this.generateState =
      deps.generateState ?? (() => toBase64Url(crypto.randomBytes(STATE_BYTE_LENGTH)));
    this.generateCodeVerifier =
      deps.generateCodeVerifier ??
      (() => toBase64Url(crypto.randomBytes(CODE_VERIFIER_BYTE_LENGTH)));
    this.generateNonce =
      deps.generateNonce ?? (() => toBase64Url(crypto.randomBytes(NONCE_BYTE_LENGTH)));
  }

  async execute(command: StartOAuthCommand): Promise<StartOAuthResult> {
    const provider = Provider.create(command.provider);
    const adapter = this.deps.oauthProviders[provider.toString()];

    if (!adapter) {
      throw new ProviderNotConfiguredError(provider.toString());
    }

    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const nonce = command.nonce ? this.generateNonce() : undefined;

    const request: OAuthAuthorizationRequest = {
      redirectUri: command.redirectUri,
      state,
      codeVerifier,
      nonce,
    };

    const authorizationUrl = await adapter.buildAuthorizationUrl(request);

    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + this.stateTtlMs);

    await this.deps.oauthStateStore.save({
      state,
      provider: provider.toString(),
      codeVerifier,
      nonce,
      redirectUri: command.redirectUri,
      expiresAt,
      createdAt,
    });

    return { authorizationUrl };
  }
}
