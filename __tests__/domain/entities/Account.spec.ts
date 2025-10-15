import { Account } from '../../../src/domain/entities/Account';
import { Id } from '../../../src/domain/value-objects/Id';
import { AuthProviderType, AuthProvider } from '../../../src/domain/value-objects/AuthProviderType';
import { PasswordHash } from '../../../src/domain/value-objects/PasswordHash';
import { CreatedAt } from '../../../src/domain/value-objects/CreatedAt';
import { UpdatedAt } from '../../../src/domain/value-objects/UpdatedAt';

describe('Account Entity', () => {
  const now = new Date('2025-10-10T10:00:00Z');

  const props = {
    id: new Id('123e4567-e89b-12d3-a456-426614174000'),
    userId: new Id('123e4567-e89b-12d3-a456-426614174001'),
    accountId: new Id('123e4567-e89b-12d3-a456-426614174002'),
    provider: new AuthProviderType(AuthProvider.GOOGLE),
    password: new PasswordHash('StrongPass1'),
    createdAt: new CreatedAt(now),
    updatedAt: new UpdatedAt(now),
  };

  it('should expose all props via getters', () => {
    const account = new Account(props);

    expect(account.id.equals(props.id)).toBe(true);
    expect(account.userId.equals(props.userId)).toBe(true);
    expect(account.accountId.equals(props.accountId)).toBe(true);
    expect(account.provider.equals(props.provider)).toBe(true);
    expect(account.password?.equals(props.password)).toBe(true);
    expect(account.createdAt.equals(props.createdAt)).toBe(true);
    expect(account.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('should allow password to be optional', () => {
    const { password: _password, ...rest } = props;
    const account = new Account(rest);
    expect(account.password).toBeUndefined();
  });
});
