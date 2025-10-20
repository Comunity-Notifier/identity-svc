import { User } from 'src/domain/aggregates/User';
import { Account } from 'src/domain/entities/Account';
import { Id } from 'src/domain/value-objects/Id';
import { Name } from 'src/domain/value-objects/Name';
import { Email } from 'src/domain/value-objects/Email';
import { Image } from 'src/domain/value-objects/Image';
import { CreatedAt } from 'src/domain/value-objects/CreatedAt';
import { UpdatedAt } from 'src/domain/value-objects/UpdatedAt';
import { PasswordHash } from 'src/domain/value-objects/PasswordHash';
import { AuthProvider, AuthProviderType } from 'src/domain/value-objects/AuthProviderType';
import { AccountExternalId } from 'src/domain/value-objects/AccountExternalId';
import { Clock } from 'src/shared/domain/time/Clock';

describe('User aggregate', () => {
  const now = new Date('2025-10-10T10:00:00Z');

  class FixedClock implements Clock {
    private current: Date;

    constructor(initial: Date) {
      this.current = new Date(initial);
    }

    now(): Date {
      return new Date(this.current);
    }

    tick(milliseconds: number): void {
      this.current = new Date(this.current.getTime() + milliseconds);
    }
  }

  const buildAccount = (userId: Id): Account =>
    new Account({
      id: new Id('223e4567-e89b-12d3-a456-426614174000'),
      userId,
      provider: new AuthProviderType(AuthProvider.GOOGLE),
      accountId: new AccountExternalId('google-123'),
      email: new Email('linked@example.com'),
      createdAt: new CreatedAt(now),
      updatedAt: new UpdatedAt(now),
    });

  const createProps = () => {
    const userId = new Id('123e4567-e89b-12d3-a456-426614174000');
    return {
      id: userId,
      name: new Name('Henry'),
      email: new Email('henry@example.com'),
      passwordHash: new PasswordHash('hashed-password'),
      image: new Image('https://example.com/avatar.png'),
      accounts: [buildAccount(userId)],
      createdAt: new CreatedAt(now),
      updatedAt: new UpdatedAt(now),
    };
  };

  it('exposes its state through getters', () => {
    const props = createProps();
    const user = new User(props);

    expect(user.id.equals(props.id)).toBe(true);
    expect(user.name.equals(props.name)).toBe(true);
    expect(user.email.equals(props.email)).toBe(true);
    expect(user.passwordHash?.equals(props.passwordHash)).toBe(true);
    expect(user.image?.equals(props.image)).toBe(true);
    expect(user.accounts).toHaveLength(1);
    expect(user.accounts[0].equals(props.accounts[0])).toBe(true);
    expect(user.createdAt.equals(props.createdAt)).toBe(true);
    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('serialises to primitives', () => {
    const user = new User(createProps());

    expect(user.toPrimitives()).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Henry',
      email: 'henry@example.com',
      passwordHash: 'hashed-password',
      image: 'https://example.com/avatar.png',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      accounts: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          provider: AuthProvider.GOOGLE,
          accountId: 'google-123',
          email: 'linked@example.com',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
    });
  });

  it('updates mutable fields and bumps updatedAt', () => {
    const clock = new FixedClock(now);
    const user = new User(createProps(), clock);

    const newName = new Name('Henri');
    const newImage = new Image('https://example.com/new-avatar.png');
    const newPassword = new PasswordHash('new-password-hash');

    clock.tick(1000);
    user.update({ name: newName, image: newImage, passwordHash: newPassword });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.passwordHash?.equals(newPassword)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('keeps updatedAt unchanged when there is no actual update', () => {
    const clock = new FixedClock(now);
    const props = createProps();
    const user = new User(props, clock);

    clock.tick(1000);
    user.update({ name: new Name('Henry') });

    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('rebuilds from primitives', () => {
    const primitives = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Henry',
      email: 'henry@example.com',
      passwordHash: 'hashed-password',
      image: 'https://example.com/avatar.png',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      accounts: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          provider: AuthProvider.GOOGLE,
          accountId: 'google-123',
          email: 'linked@example.com',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
    };

    const reconstructed = User.fromPrimitives(primitives);

    expect(reconstructed.toPrimitives()).toEqual(primitives);
  });

  it('rejects accounts belonging to other users', () => {
    const props = createProps();
    expect(
      () =>
        new User({
          ...props,
          accounts: [buildAccount(new Id('999e4567-e89b-12d3-a456-426614174999'))],
        })
    ).toThrow('UserAccountOwnerMismatch');
  });
});
