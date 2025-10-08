import { describe, expect, it, jest } from '@jest/globals';
import {
  LoginUserLocal,
  LoginUserLocalDeps,
} from '../../../src/application/useCases/loginUserLocal';
import { PasswordHasher } from '../../../src/application/ports/passwordHasher';
import { TokenService } from '../../../src/application/ports/tokenService';
import { UserRepository } from '../../../src/application/ports/userRepository';
import { InvalidCredentialsError } from '../../../src/domain/domainErrors';
import { User } from '../../../src/domain/aggregates/user';
import { Email } from '../../../src/domain/valueObjects/email';
import { Name } from '../../../src/domain/valueObjects/name';
import { PasswordHash } from '../../../src/domain/valueObjects/passwordHash';
import { AccessToken } from '../../../src/application/dtos';

interface LoginUserLocalDepsMocks {
  userRepository: jest.Mocked<UserRepository>;
  passwordHasher: jest.Mocked<PasswordHasher>;
  tokenService: jest.Mocked<TokenService>;
}

const buildDeps = (): LoginUserLocalDeps & LoginUserLocalDepsMocks => {
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

const buildStoredUser = () =>
  User.createLocal({
    name: Name.create('Existing User'),
    email: Email.create('ada@example.com'),
    passwordHash: PasswordHash.create('hash'),
  });

describe('LoginUserLocal use case', () => {
  it('logs in a user with valid credentials', async () => {
    const deps = buildDeps();
    const useCase = new LoginUserLocal(deps);
    const user = buildStoredUser();
    const token: AccessToken = {
      token: 'jwt-token',
      expiresAt: new Date(Date.now() + 3600_000),
    };

    deps.userRepository.findByEmail.mockResolvedValue(user);
    deps.passwordHasher.verify.mockResolvedValue(true);
    deps.tokenService.signAccessToken.mockResolvedValue(token);

    const result = await useCase.execute({
      email: 'ada@example.com',
      password: 'secret',
    });

    expect(deps.passwordHasher.verify).toHaveBeenCalledWith('secret', user.passwordHash!);
    expect(result.accessToken).toEqual(token);
    expect(result.user.id).toBe(user.id.toString());
  });

  it('throws when user is not found', async () => {
    const deps = buildDeps();
    const useCase = new LoginUserLocal(deps);

    deps.userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'ada@example.com',
        password: 'secret',
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws when password is invalid', async () => {
    const deps = buildDeps();
    const useCase = new LoginUserLocal(deps);
    const user = buildStoredUser();

    deps.userRepository.findByEmail.mockResolvedValue(user);
    deps.passwordHasher.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'ada@example.com',
        password: 'wrong',
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
