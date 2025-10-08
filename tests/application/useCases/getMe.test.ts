import { describe, expect, it, jest } from '@jest/globals';

import { GetMe, GetMeDeps } from '../../../src/application/useCases/getMe';
import { UserRepository } from '../../../src/application/ports/userRepository';
import { User } from '../../../src/domain/aggregates/user';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';
import { UserNotFoundError } from '../../../src/domain/domainErrors';
import { UserId } from '../../../src/domain/valueObjects/userId';

const buildUser = (): User =>
  User.createLocal({
    name: Name.create('Ada Lovelace'),
    email: Email.create('ada@example.com'),
    passwordHash: PasswordHash.create('hash'),
  });

const buildDeps = (overrides: Partial<GetMeDeps> = {}): GetMeDeps => {
  const userRepository: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  return {
    userRepository,
    ...overrides,
  };
};

describe('GetMe use case', () => {
  it('returns user details when found', async () => {
    const deps = buildDeps();
    const user = buildUser();
    const userId = user.id.toString();
    (deps.userRepository as jest.Mocked<UserRepository>).findById.mockResolvedValue(user);

    const useCase = new GetMe(deps);
    const result = await useCase.execute({ userId });

    expect(result.user.id).toBe(userId);
    expect(result.user.email).toBe('ada@example.com');
    expect(result.user.name).toBe('Ada Lovelace');
  });

  it('throws when user is not found', async () => {
    const deps = buildDeps();
    (deps.userRepository as jest.Mocked<UserRepository>).findById.mockResolvedValue(null);

    const useCase = new GetMe(deps);
    const missingUserId = UserId.generate().toString();

    await expect(useCase.execute({ userId: missingUserId })).rejects.toBeInstanceOf(
      UserNotFoundError
    );
  });
});
