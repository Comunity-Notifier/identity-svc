import { User } from '../../domain/aggregates/user';
import { TokenPayload } from '../dtos';

export const buildTokenPayload = (user: User): TokenPayload => {
  const providerAccounts = user.accounts.map((account) => ({
    provider: account.provider.toString(),
    providerUserId: account.providerUserId.toString(),
  }));

  if (user.passwordHash) {
    providerAccounts.push({
      provider: 'local',
      providerUserId: user.id.toString(),
    });
  }

  return {
    sub: user.id.toString(),
    email: user.email.toString(),
    name: user.name.toString(),
    providerAccounts,
  };
};
