import { describe, expect, it, jest } from '@jest/globals';
import { AccessToken } from '../../../src/application/dtos';
import {
  RegisterUserLocal,
  RegisterUserLocalDeps,
} from '../../../src/application/useCases/registerUserLocal';
import { PasswordHasher } from '../../../src/application/ports/passwordHasher';
import { TokenService } from '../../../src/application/ports/tokenService';
import { UserRepository } from '../../../src/application/ports/userRepository';
import { EmailAlreadyTakenError } from '../../../src/domain/domainErrors';
import { User } from '../../../src/domain/aggregates/user';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';

interface RegisterUserLocalDepsMocks {
  userRepository: jest.Mocked<UserRepository>;
  passwordHasher: jest.Mocked<PasswordHasher>;
  tokenService: jest.Mocked<TokenService>;
}

const buildDeps = (): RegisterUserLocalDeps & RegisterUserLocalDepsMocks => {
  const userRepository: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn<UserRepository['findByEmail']>(),
    findById: jest.fn<UserRepository['findById']>(),
    save: jest.fn<UserRepository['save']>(),
    update: jest.fn<UserRepository['update']>(),
  };

  const passwordHasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn<PasswordHasher['hash']>(),
    verify: jest.fn<PasswordHasher['verify']>(),
  };

  const tokenService: jest.Mocked<TokenService> = {
    signAccessToken: jest.fn<TokenService['signAccessToken']>(),
    verify: jest.fn<TokenService['verify']>(),
    getPublicJwks: jest.fn<TokenService['getPublicJwks']>(),
  };

  return {
    userRepository,
    passwordHasher,
    tokenService,
  };
};

describe('RegisterUserLocal use case', () => {
  it('registers a new user and returns an access token', async () => {
    const deps = buildDeps();
    const useCase = new RegisterUserLocal(deps);
    const token: AccessToken = {
      token: 'jwt-token',
      expiresAt: new Date(Date.now() + 3600_000),
    };

    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.passwordHasher.hash.mockResolvedValue(PasswordHash.create('hashedPassword'));
    deps.tokenService.signAccessToken.mockResolvedValue(token);

    const result = await useCase.execute({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'securePassword123',
    });

    expect(deps.userRepository.save.mock.calls).toHaveLength(1);
    const savedUser = deps.userRepository.save.mock.calls[0][0];
    expect(savedUser.email.toString()).toBe('ada@example.com');
    expect(savedUser.name.toString()).toBe('Ada Lovelace');
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('securePassword123');
    expect(result.accessToken).toEqual(token);
    expect(result.user.email).toBe('ada@example.com');
  });

  it('throws when email is already taken', async () => {
    const deps = buildDeps();
    const useCase = new RegisterUserLocal(deps);

    const existingUser = User.createLocal({
      name: Name.create('Existing User'),
      email: Email.create('ada@example.com'),
      passwordHash: PasswordHash.create('hash'),
    });

    deps.userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'secret',
      })
    ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
  });
});
