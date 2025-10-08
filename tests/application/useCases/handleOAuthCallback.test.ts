import { describe, expect, it, jest } from '@jest/globals';

import {
  HandleOAuthCallback,
  HandleOAuthCallbackDeps,
} from '../../../src/application/useCases/handleOAuthCallback';
import { OAuthStateStore } from '../../../src/application/ports/oauthStateStore';
import { OAuthProvider, OAuthProfileRequest } from '../../../src/application/ports/oauthProvider';
import { AccountRepository } from '../../../src/application/ports/accountRepository';
import { UserRepository } from '../../../src/application/ports/userRepository';
import { TokenService } from '../../../src/application/ports/tokenService';
import { AccessToken } from '../../../src/application/dtos';
import {
  OAuthProfileEmailRequiredError,
  OAuthStateExpiredError,
} from '../../../src/domain/domainErrors';
import { User } from '../../../src/domain/aggregates/user';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';
import { Provider } from '../../../src/domain/valueObjects/provider';
import { ProviderUserId } from '../../../src/domain/valueObjects/providerUserId';

const fixedNow = new Date('2024-01-01T00:00:00.000Z');
const expiresAt = new Date(fixedNow.getTime() + 60_000);

const buildUser = (): User =>
  User.createLocal({
    name: Name.create('Existing User'),
    email: Email.create('ada@example.com'),
    passwordHash: PasswordHash.create('hash'),
  });

const buildProviderMock = (providerCode: string): jest.Mocked<OAuthProvider> => ({
  provider: providerCode,
  buildAuthorizationUrl: jest.fn(),
  getProfile: jest.fn(),
});

const buildDeps = (overrides: Partial<HandleOAuthCallbackDeps> = {}): HandleOAuthCallbackDeps => {
  const oauthStateStore: jest.Mocked<OAuthStateStore> = {
    save: jest.fn(),
    get: jest.fn(),
    consume: jest.fn(),
  };

  oauthStateStore.consume.mockResolvedValue({
    state: 'state-123',
    provider: 'google',
    codeVerifier: 'verifier-xyz',
    nonce: 'nonce-abc',
    redirectUri: 'https://app.example.com/oauth/callback',
    createdAt: fixedNow,
    expiresAt,
  });

  const accountRepository: jest.Mocked<AccountRepository> = {
    findByProviderUserId: jest.fn(),
    linkToUser: jest.fn(),
  };

  const userRepository: jest.Mocked<UserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const tokenService: jest.Mocked<TokenService> = {
    signAccessToken: jest.fn(),
    verify: jest.fn(),
    getPublicJwks: jest.fn(),
  };
  const accessToken: AccessToken = {
    token: 'jwt-token',
    expiresAt: new Date(fixedNow.getTime() + 3600_000),
  };
  tokenService.signAccessToken.mockResolvedValue(accessToken);

  const provider = buildProviderMock('google');
  provider.getProfile.mockResolvedValue({
    provider: 'google',
    providerUserId: 'google-123',
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada Lovelace',
  });

  return {
    oauthStateStore,
    accountRepository,
    userRepository,
    tokenService,
    oauthProviders: { google: provider },
    now: () => fixedNow,
    ...overrides,
  };
};

describe('HandleOAuthCallback use case', () => {
  it('returns token for existing linked account', async () => {
    const deps = buildDeps();
    const user = buildUser();
    const providerVo = Provider.create('google');
    const providerUserId = ProviderUserId.create('google-123');
    const account = user.linkAccount({
      provider: providerVo,
      providerUserId,
    });
    const accountRepository = deps.accountRepository as jest.Mocked<AccountRepository>;
    accountRepository.findByProviderUserId.mockResolvedValue({
      user,
      account,
    });

    const useCase = new HandleOAuthCallback(deps);
    const result = await useCase.execute({
      provider: 'google',
      code: 'code-123',
      state: 'state-123',
    });

    const providerMock = deps.oauthProviders.google as jest.Mocked<OAuthProvider>;
    const request = providerMock.getProfile.mock.calls[0][0];
    expect(request).toEqual({
      code: 'code-123',
      codeVerifier: 'verifier-xyz',
      redirectUri: 'https://app.example.com/oauth/callback',
    } satisfies OAuthProfileRequest);

    expect(result.user.email).toBe('ada@example.com');
    expect(result.accessToken.token).toBe('jwt-token');
    expect(accountRepository.linkToUser.mock.calls).toHaveLength(0);
    const userRepository = deps.userRepository as jest.Mocked<UserRepository>;
    expect(userRepository.save.mock.calls).toHaveLength(0);
  });

  it('links new account to existing user', async () => {
    const deps = buildDeps();
    const user = buildUser();
    const providerVo = Provider.create('google');
    const providerUserId = ProviderUserId.create('google-123');
    const accountRepository = deps.accountRepository as jest.Mocked<AccountRepository>;
    const userRepository = deps.userRepository as jest.Mocked<UserRepository>;

    accountRepository.findByProviderUserId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(user);

    const useCase = new HandleOAuthCallback(deps);
    const result = await useCase.execute({
      provider: 'google',
      code: 'code-123',
      state: 'state-123',
    });

    expect(accountRepository.linkToUser.mock.calls).toHaveLength(1);
    const [linkedUser, account] = accountRepository.linkToUser.mock.calls[0];
    expect(linkedUser).toBe(user);
    expect(account.provider.toString()).toBe(providerVo.toString());
    expect(account.providerUserId.toString()).toBe(providerUserId.toString());
    expect(result.user.email).toBe('ada@example.com');
    expect(result.accessToken.token).toBe('jwt-token');
  });

  it('creates a new user when no account or email match exists', async () => {
    const deps = buildDeps();
    const accountRepository = deps.accountRepository as jest.Mocked<AccountRepository>;
    const userRepository = deps.userRepository as jest.Mocked<UserRepository>;

    accountRepository.findByProviderUserId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);

    const useCase = new HandleOAuthCallback(deps);
    const result = await useCase.execute({
      provider: 'google',
      code: 'code-123',
      state: 'state-123',
    });

    expect(userRepository.save.mock.calls).toHaveLength(1);
    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.email.toString()).toBe('ada@example.com');
    expect(savedUser.accounts).toHaveLength(1);
    expect(savedUser.accounts[0]?.provider.toString()).toBe('google');
    expect(result.accessToken.token).toBe('jwt-token');
  });

  it('throws when state is missing or expired', async () => {
    const deps = buildDeps();
    const oauthStateStore = deps.oauthStateStore as jest.Mocked<OAuthStateStore>;
    oauthStateStore.consume.mockResolvedValue(null);
    const useCase = new HandleOAuthCallback(deps);

    await expect(
      useCase.execute({
        provider: 'google',
        code: 'code-123',
        state: 'unknown',
      })
    ).rejects.toBeInstanceOf(OAuthStateExpiredError);
  });

  it('throws when provider response does not include email', async () => {
    const deps = buildDeps();
    const accountRepository = deps.accountRepository as jest.Mocked<AccountRepository>;
    const userRepository = deps.userRepository as jest.Mocked<UserRepository>;
    accountRepository.findByProviderUserId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);

    const providerMock = deps.oauthProviders.google as jest.Mocked<OAuthProvider>;
    providerMock.getProfile.mockResolvedValue({
      provider: 'google',
      providerUserId: 'google-123',
      email: undefined,
      name: 'Ada Lovelace',
    });

    const useCase = new HandleOAuthCallback(deps);

    await expect(
      useCase.execute({
        provider: 'google',
        code: 'code-123',
        state: 'state-123',
      })
    ).rejects.toBeInstanceOf(OAuthProfileEmailRequiredError);
  });
});
