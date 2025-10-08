import { Account } from '../../domain/aggregates/account';
import { User } from '../../domain/aggregates/user';
import {
  OAuthProfileEmailRequiredError,
  OAuthStateExpiredError,
  ProviderNotConfiguredError,
} from '../../domain/domainErrors';
import { Email } from '../../domain/valueObjects/email';
import { Name } from '../../domain/valueObjects/name';
import { Provider } from '../../domain/valueObjects/provider';
import { ProviderUserId } from '../../domain/valueObjects/providerUserId';
import { UserId } from '../../domain/valueObjects/userId';
import { AuthenticatedUser, HandleOAuthCallbackCommand, HandleOAuthCallbackResult } from '../dtos';
import { buildTokenPayload } from './tokenPayload';
import { TokenService } from '../ports/tokenService';
import { OAuthStateStore } from '../ports/oauthStateStore';
import { OAuthProvider, OAuthProfileRequest } from '../ports/oauthProvider';
import { AccountRepository } from '../ports/accountRepository';
import { UserRepository } from '../ports/userRepository';

type ProviderMap = Record<string, OAuthProvider>;

export interface HandleOAuthCallbackDeps {
  oauthStateStore: OAuthStateStore;
  oauthProviders: ProviderMap;
  accountRepository: AccountRepository;
  userRepository: UserRepository;
  tokenService: TokenService;
  now?: () => Date;
}

export class HandleOAuthCallback {
  private readonly now: () => Date;

  constructor(private readonly deps: HandleOAuthCallbackDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async execute(command: HandleOAuthCallbackCommand): Promise<HandleOAuthCallbackResult> {
    const provider = Provider.create(command.provider);
    const adapter = this.deps.oauthProviders[provider.toString()];

    if (!adapter) {
      throw new ProviderNotConfiguredError(provider.toString());
    }

    const stateRecord = await this.deps.oauthStateStore.consume(command.state);

    if (!stateRecord) {
      throw new OAuthStateExpiredError();
    }

    const now = this.now();
    if (
      stateRecord.provider !== provider.toString() ||
      stateRecord.expiresAt.getTime() <= now.getTime()
    ) {
      throw new OAuthStateExpiredError();
    }

    const request: OAuthProfileRequest = {
      code: command.code,
      codeVerifier: stateRecord.codeVerifier,
      redirectUri: stateRecord.redirectUri,
    };

    const profile = await adapter.getProfile(request);

    const providerUserId = ProviderUserId.create(profile.providerUserId);

    const existingAccount = await this.deps.accountRepository.findByProviderUserId(
      provider,
      providerUserId
    );

    let user: User;

    if (existingAccount) {
      user = existingAccount.user;
    } else {
      const email = profile.email ?? null;

      if (!email) {
        throw new OAuthProfileEmailRequiredError(provider.toString());
      }

      const emailVo = Email.create(email);
      const providerEmailVo = profile.email ? Email.create(profile.email) : undefined;
      const nameValue = profile.name ?? emailVo.toString().split('@')[0] ?? emailVo.toString();
      const nameVo = Name.create(nameValue);

      const providerAccount = Account.create({
        provider,
        providerUserId,
        email: providerEmailVo,
      });

      const existingUser = await this.deps.userRepository.findByEmail(emailVo);

      if (existingUser) {
        const account = existingUser.linkAccount({
          provider,
          providerUserId,
          email: providerEmailVo,
        });
        await this.deps.accountRepository.linkToUser(existingUser, account);
        user = existingUser;
      } else {
        user = User.create({
          id: UserId.generate(),
          name: nameVo,
          email: emailVo,
          accounts: [providerAccount],
        });

        await this.deps.userRepository.save(user);
      }
    }

    const payload = buildTokenPayload(user);
    const accessToken = await this.deps.tokenService.signAccessToken(payload);

    const authenticatedUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
    };

    return { user: authenticatedUser, accessToken };
  }
}
